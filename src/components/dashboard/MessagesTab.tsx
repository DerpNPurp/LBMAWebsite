import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Send, Paperclip, Users as UsersIcon, Loader2 } from 'lucide-react';
import {
  getGlobalConversation,
  getUserConversations,
  getConversationMembers,
  getMessages,
  getDirectMessageConversation,
  getAllProfiles,
} from '../../lib/supabase/queries';
import {
  createConversation,
  addConversationMember,
  createMessage,
  createMessageAttachment,
} from '../../lib/supabase/mutations';
import { subscribeToMessages, unsubscribe } from '../../lib/supabase/realtime';
import { uploadFile, generateFilePath, isValidFileType, MAX_FILE_SIZE_MB, getFileSizeMB } from '../../lib/supabase/storage';
import type { Conversation as ConversationType, Message as MessageType } from '../../lib/types';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'family';
  displayName: string;
};

type Message = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  attachmentName?: string;
  attachmentUrl?: string;
};

type Conversation = {
  id: string;
  name: string;
  type: 'direct' | 'group';
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
};

export function MessagesTab({ user }: { user: User }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({});
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConversationId]);

  // Load conversations and ensure global conversation exists
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        
        // Load all profiles for DM names
        const profiles = await getAllProfiles();
        setAllProfiles(profiles);

        // Get or create global conversation
        let globalConv = await getGlobalConversation();
        if (!globalConv) {
          // Create global conversation
          globalConv = await createConversation({
            type: 'global',
            created_by: user.id,
          });
          
          // Add all users to global conversation (simplified - in production, you'd add all families + admins)
          // For now, we'll add users as they join
        }

        // Load user's conversations
        const userConvs = await getUserConversations(user.id);
        
        // Format conversations
        const formattedConvs: Conversation[] = [];
        
        // Add global conversation
        if (globalConv) {
          const globalMembers = await getConversationMembers(globalConv.conversation_id);
          const globalMessages = await getMessages(globalConv.conversation_id);
          const lastMsg = globalMessages[globalMessages.length - 1];
          
          formattedConvs.push({
            id: globalConv.conversation_id,
            name: 'Everyone - Group Chat',
            type: 'group',
            unreadCount: 0, // TODO: Implement unread tracking
            lastMessage: lastMsg?.body?.substring(0, 50),
            lastMessageTime: lastMsg?.created_at,
          });

          // Load messages for global conversation
          setMessages((prev) => ({
            ...prev,
            [globalConv!.conversation_id]: formatMessages(globalMessages),
          }));
        }

        // Add direct message conversations
        for (const conv of userConvs) {
          if (conv.type === 'dm') {
            const members = await getConversationMembers(conv.conversation_id);
            const otherMember = members.find((m: any) => m.user_id !== user.id);
            const otherProfile = profiles.find((p: any) => p.user_id === otherMember?.user_id);
            
            const convMessages = await getMessages(conv.conversation_id);
            const lastMsg = convMessages[convMessages.length - 1];
            
            formattedConvs.push({
              id: conv.conversation_id,
              name: otherProfile?.display_name || 'Unknown',
              type: 'direct',
              unreadCount: 0,
              lastMessage: lastMsg?.body?.substring(0, 50),
              lastMessageTime: lastMsg?.created_at,
            });

            setMessages((prev) => ({
              ...prev,
              [conv.conversation_id]: formatMessages(convMessages),
            }));
          }
        }

        setConversations(formattedConvs);
        
        // Select global conversation by default
        if (globalConv && formattedConvs.length > 0) {
          setSelectedConversationId(globalConv.conversation_id);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        alert('Error loading conversations: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  // Set up real-time subscriptions for selected conversation
  useEffect(() => {
    if (!selectedConversationId) return;

    const channel = subscribeToMessages(selectedConversationId, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        // Reload messages for this conversation
        getMessages(selectedConversationId).then((messagesData) => {
          setMessages((prev) => ({
            ...prev,
            [selectedConversationId]: formatMessages(messagesData),
          }));
        });
      }
    });

    return () => {
      unsubscribe(channel);
    };
  }, [selectedConversationId]);

  const formatMessages = (messagesData: any[]): Message[] => {
    return messagesData.map((m: any) => ({
      id: m.message_id,
      authorId: m.author_user_id,
      authorName: m.profiles?.display_name || 'Unknown',
      body: m.body,
      createdAt: m.created_at,
      attachmentName: m.message_attachments?.[0]?.file_name,
      attachmentUrl: m.message_attachments?.[0]?.storage_path,
    }));
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const currentMessages = selectedConversationId ? (messages[selectedConversationId] || []) : [];

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversationId || !user) return;

    setSending(true);
    try {
      await createMessage({
        conversation_id: selectedConversationId,
        author_user_id: user.id,
        body: messageText.trim(),
      });

      // Reload messages
      const messagesData = await getMessages(selectedConversationId);
      setMessages((prev) => ({
        ...prev,
        [selectedConversationId]: formatMessages(messagesData),
      }));

      setMessageText('');
    } catch (error) {
      alert('Error sending message: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversationId || !user) return;

    if (!isValidFileType(file.name)) {
      alert('Invalid file type. Please upload images, PDFs, or documents.');
      return;
    }

    const fileSizeMB = getFileSizeMB(file.size);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      alert(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }

    setUploadingFile(true);
    try {
      // Upload file
      const filePath = generateFilePath(user.id, file.name);
      const { path } = await uploadFile(file, filePath);

      // Send message with attachment
      const message = await createMessage({
        conversation_id: selectedConversationId,
        author_user_id: user.id,
        body: `[File: ${file.name}]`,
      });

      // Create attachment record
      await createMessageAttachment({
        message_id: message.message_id,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });

      // Reload messages
      const messagesData = await getMessages(selectedConversationId);
      setMessages((prev) => ({
        ...prev,
        [selectedConversationId]: formatMessages(messagesData),
      }));
    } catch (error) {
      alert('Error uploading file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Messages</h2>
        <p className="text-muted-foreground mt-1">
          Connect with instructors and the LBMAA community
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 p-4 pt-0">
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">No conversations yet.</p>
                ) : (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedConversationId === conversation.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback>
                              {conversation.type === 'group' ? (
                                <UsersIcon className="w-5 h-5" />
                              ) : (
                                conversation.name[0]
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{conversation.name}</p>
                            {conversation.lastMessage && (
                              <p className="text-sm opacity-70 truncate">
                                {conversation.lastMessage}
                              </p>
                            )}
                          </div>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <Badge className="ml-2 h-5 px-2 text-xs bg-primary flex-shrink-0">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {conversation.lastMessageTime && (
                        <p className="text-xs opacity-70 mt-1">
                          {formatTime(conversation.lastMessageTime)}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className="md:col-span-2 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {selectedConversation?.type === 'group' ? (
                    <UsersIcon className="w-5 h-5" />
                  ) : (
                    selectedConversation?.name[0] || '?'
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{selectedConversation?.name || 'Select a conversation'}</CardTitle>
                {selectedConversation?.type === 'group' && (
                  <p className="text-sm text-muted-foreground">
                    All families and instructors
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {currentMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  currentMessages.map((message) => {
                    const isOwnMessage = message.authorId === user.id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary'
                          } rounded-lg p-3`}
                        >
                          {!isOwnMessage && (
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {message.authorName}
                            </p>
                          )}
                          <p className="text-sm">{message.body}</p>
                          {message.attachmentName && (
                            <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                              <Paperclip className="w-3 h-3" />
                              <span>{message.attachmentName}</span>
                            </div>
                          )}
                          <p className="text-xs opacity-70 mt-1">
                            {formatMessageTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            {selectedConversationId && (
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sending}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedConversation?.type === 'direct' 
                    ? 'Direct message with instructor'
                    : 'Message visible to all families and instructors'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="bg-secondary border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm">
            <strong>Note:</strong> Direct messaging is available between families and instructors only. 
            For parent-to-parent communication, please use the Parent Blog or Group Chat.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
