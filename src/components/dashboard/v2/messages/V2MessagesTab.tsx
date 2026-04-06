import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { ScrollArea } from '../../../ui/scroll-area';
import { Avatar, AvatarFallback } from '../../../ui/avatar';
import { Badge } from '../../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import {
  Send, Paperclip, Users as UsersIcon, Loader2, ArrowLeft, MessageCircle,
} from 'lucide-react';
import {
  getGlobalConversation, getUserConversations, getConversationMembers,
  getMessages, getAllProfiles, getDirectMessageConversation,
} from '../../../../lib/supabase/queries';
import {
  addConversationMember, createMessage, createMessageAttachment,
  createOrGetDirectConversation, markConversationAsRead,
} from '../../../../lib/supabase/mutations';
import { subscribeToMessages, unsubscribe } from '../../../../lib/supabase/realtime';
import {
  uploadFile, generateFilePath, isValidFileType, MAX_FILE_SIZE_MB,
  getFileSizeMB, getSignedUrl,
} from '../../../../lib/supabase/storage';
import {
  calculateUnreadCount, formatConversationTime, formatMessages,
  formatMessageTime, getErrorMessage, isDirectConversationAllowed,
  type MessageListItem,
} from '../../messages/helpers';
import { V2PageHeader } from '../shared/V2PageHeader';
import { V2SkeletonList } from '../shared/V2SkeletonList';

type User = { id: string; email: string; role: 'admin' | 'family'; displayName: string };
type Conversation = {
  id: string; name: string; type: 'direct' | 'group';
  unreadCount: number; lastMessage?: string; lastMessageTime?: string;
};
type DirectMessageTarget = { userId: string; displayName: string; role: 'admin' | 'family' };

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function V2MessagesTab({
  user,
  onUnreadCountChange,
}: {
  user: User;
  onUnreadCountChange?: (count: number) => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ [id: string]: MessageListItem[] }>({});
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [openingAttachmentId, setOpeningAttachmentId] = useState<string | null>(null);
  const [allowedDirectIds, setAllowedDirectIds] = useState<string[]>([]);
  const [dmTargets, setDmTargets] = useState<DirectMessageTarget[]>([]);
  const [selectedDmTargetId, setSelectedDmTargetId] = useState('');
  const [creatingDm, setCreatingDm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Emit unread count changes
  useEffect(() => {
    if (!onUnreadCountChange) return;
    onUnreadCountChange(conversations.reduce((t, c) => t + c.unreadCount, 0));
  }, [conversations, onUnreadCountChange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedConversationId]);

  const markRead = async (conversationId: string) => {
    await markConversationAsRead(conversationId, user.id);
    setConversations((prev) =>
      prev.map((c) => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
    );
  };

  const upsertConversation = (conv: Conversation) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === conv.id);
      if (idx >= 0) { const u = [...prev]; u[idx] = conv; return u; }
      return [conv, ...prev];
    });
  };

  const safeAddMember = async (conversationId: string, memberUserId: string) => {
    try {
      await addConversationMember({ conversation_id: conversationId, user_id: memberUserId });
    } catch (error: any) {
      if (error?.code !== '23505') throw error;
    }
  };

  const handleCreateDm = async () => {
    if (!selectedDmTargetId || creatingDm) return;
    const target = dmTargets.find((t) => t.userId === selectedDmTargetId);
    if (!target) return;
    setCreatingDm(true);
    try {
      let directConv = await getDirectMessageConversation(user.id, selectedDmTargetId);
      if (!directConv) {
        const convId = await createOrGetDirectConversation(selectedDmTargetId);
        const refreshed = await getUserConversations(user.id);
        directConv = refreshed.find((c) => c.conversation_id === convId) || null;
        if (!directConv) throw new Error('Conversation created but could not be loaded.');
      }
      const msgs = await getMessages(directConv.conversation_id);
      const lastMsg = msgs[msgs.length - 1];
      const selfMembership = Array.isArray((directConv as any).conversation_members)
        ? (directConv as any).conversation_members.find((m: any) => m.user_id === user.id)
        : null;
      setMessages((prev) => ({ ...prev, [directConv!.conversation_id]: formatMessages(msgs) }));
      setAllowedDirectIds((prev) =>
        prev.includes(directConv!.conversation_id) ? prev : [...prev, directConv!.conversation_id]
      );
      upsertConversation({
        id: directConv.conversation_id, name: target.displayName, type: 'direct',
        unreadCount: calculateUnreadCount(msgs, user.id, selfMembership?.last_read_at),
        lastMessage: lastMsg?.body?.substring(0, 50), lastMessageTime: lastMsg?.created_at,
      });
      setSelectedConversationId(directConv.conversation_id);
      setSelectedDmTargetId('');
    } catch (error) {
      alert('Error creating direct message: ' + getErrorMessage(error));
    } finally {
      setCreatingDm(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const profiles = await getAllProfiles();
        const targets = profiles
          .filter((p) => p.user_id !== user.id && isDirectConversationAllowed(user.role, p.role))
          .map((p) => ({ userId: p.user_id, displayName: p.display_name || 'Unknown', role: p.role }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName));
        setDmTargets(targets);

        let globalConv = await getGlobalConversation();
        if (globalConv) {
          try { await safeAddMember(globalConv.conversation_id, user.id); } catch (e: any) {
            if (e?.code !== '42501') throw e;
          }
        }

        const userConvs = await getUserConversations(user.id);
        const formattedConvs: Conversation[] = [];
        const validDirectIds: string[] = [];

        for (const conv of userConvs) {
          const members = Array.isArray((conv as any).conversation_members)
            ? (conv as any).conversation_members : [];
          const selfMembership = members.find((m: any) => m.user_id === user.id);
          const msgs = await getMessages(conv.conversation_id);
          const lastMsg = msgs[msgs.length - 1];
          const unreadCount = calculateUnreadCount(msgs, user.id, selfMembership?.last_read_at);

          if (conv.type === 'global') {
            formattedConvs.push({
              id: conv.conversation_id, name: 'Everyone — Group Chat',
              type: 'group', unreadCount,
              lastMessage: lastMsg?.body?.substring(0, 50),
              lastMessageTime: lastMsg?.created_at,
            });
            setMessages((prev) => ({ ...prev, [conv.conversation_id]: formatMessages(msgs) }));
            continue;
          }

          if (conv.type !== 'dm') continue;
          const convMembers = await getConversationMembers(conv.conversation_id);
          const otherMember = convMembers.find((m: any) => m.user_id !== user.id);
          const otherProfile = profiles.find((p: any) => p.user_id === otherMember?.user_id);
          if (!isDirectConversationAllowed(user.role, otherProfile?.role)) continue;

          validDirectIds.push(conv.conversation_id);
          formattedConvs.push({
            id: conv.conversation_id, name: otherProfile?.display_name || 'Unknown',
            type: 'direct', unreadCount,
            lastMessage: lastMsg?.body?.substring(0, 50), lastMessageTime: lastMsg?.created_at,
          });
          setMessages((prev) => ({ ...prev, [conv.conversation_id]: formatMessages(msgs) }));
        }

        setAllowedDirectIds(validDirectIds);
        setConversations(formattedConvs);

        if (formattedConvs.length > 0) {
          const globalC = formattedConvs.find((c) => c.type === 'group');
          setSelectedConversationId(globalC?.id ?? formattedConvs[0].id);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!selectedConversationId || loading) return;
    markRead(selectedConversationId).catch(console.error);
  }, [selectedConversationId, loading]);

  useEffect(() => {
    if (!selectedConversationId) return;
    const ch = subscribeToMessages(selectedConversationId, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        getMessages(selectedConversationId).then((data) => {
          setMessages((prev) => ({ ...prev, [selectedConversationId]: formatMessages(data) }));
        });
      }
    });
    return () => unsubscribe(ch);
  }, [selectedConversationId]);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
  const currentMessages = selectedConversationId ? (messages[selectedConversationId] || []) : [];
  const canSend = Boolean(
    selectedConversation &&
    (selectedConversation.type === 'group' || allowedDirectIds.includes(selectedConversation.id))
  );

  const handleSend = async () => {
    if (!messageText.trim() || !selectedConversationId || !canSend) return;
    setSending(true);
    try {
      await createMessage({ conversation_id: selectedConversationId, author_user_id: user.id, body: messageText.trim() });
      await markRead(selectedConversationId);
      const msgs = await getMessages(selectedConversationId);
      setMessages((prev) => ({ ...prev, [selectedConversationId]: formatMessages(msgs) }));
      setMessageText('');
    } catch (error) {
      alert('Error sending message: ' + getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversationId || !canSend) return;
    if (!isValidFileType(file.name)) { alert('Invalid file type.'); return; }
    if (getFileSizeMB(file.size) > MAX_FILE_SIZE_MB) { alert(`File exceeds ${MAX_FILE_SIZE_MB}MB.`); return; }

    setUploadingFile(true);
    try {
      const filePath = generateFilePath(user.id, file.name);
      const { path } = await uploadFile(file, filePath);
      const msg = await createMessage({
        conversation_id: selectedConversationId, author_user_id: user.id, body: `[File: ${file.name}]`,
      });
      await markRead(selectedConversationId);
      await createMessageAttachment({ message_id: msg.message_id, storage_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size });
      const msgs = await getMessages(selectedConversationId);
      setMessages((prev) => ({ ...prev, [selectedConversationId]: formatMessages(msgs) }));
    } catch (error) {
      alert('Error uploading file: ' + getErrorMessage(error));
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenAttachment = async (msg: MessageListItem) => {
    if (!msg.attachmentPath) return;
    setOpeningAttachmentId(msg.id);
    try {
      const url = await getSignedUrl(msg.attachmentPath, 300);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      alert('Unable to open attachment: ' + getErrorMessage(error));
    } finally {
      setOpeningAttachmentId(null);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <V2PageHeader title="Messages" description="Connect with instructors and the LBMAA community." />
      <V2SkeletonList rows={4} showAvatar />
    </div>
  );

  // Mobile: show either list or thread
  const showList = !selectedConversationId;
  const showThread = !!selectedConversationId;

  return (
    <div className="space-y-4">
      {/* Page header — only show on desktop or when showing list on mobile */}
      <div className={selectedConversationId ? 'hidden md:block' : ''}>
        <V2PageHeader
          title="Messages"
          description="Connect with instructors and the LBMAA community."
        />
      </div>

      {/* Mobile back header when thread is showing */}
      {selectedConversationId && (
        <div className="flex items-center gap-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedConversationId(null)}
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {selectedConversation?.type === 'group'
                  ? <UsersIcon className="w-4 h-4" />
                  : getInitials(selectedConversation?.name || '?')}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold text-foreground truncate">{selectedConversation?.name}</p>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="grid md:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 240px)', minHeight: '480px' }}>

        {/* Conversation List — hidden on mobile when thread is open */}
        <Card className={['md:col-span-1 flex flex-col overflow-hidden', selectedConversationId ? 'hidden md:flex' : 'flex'].join(' ')}>
          {/* DM creator */}
          <div className="p-3 border-b border-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Direct Messages
            </p>
            <div className="flex gap-2">
              <Select value={selectedDmTargetId} onValueChange={setSelectedDmTargetId}>
                <SelectTrigger className="flex-1 h-9 text-sm">
                  <SelectValue placeholder="Select person..." />
                </SelectTrigger>
                <SelectContent>
                  {dmTargets.map((t) => (
                    <SelectItem key={t.userId} value={t.userId}>
                      {t.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-9 px-3 text-sm shrink-0"
                disabled={!selectedDmTargetId || creatingDm}
                onClick={handleCreateDm}
              >
                {creatingDm ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Open'}
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map((conv) => {
                const isSelected = conv.id === selectedConversationId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={[
                      'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted/60',
                    ].join(' ')}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className={isSelected ? 'bg-white/20 text-primary-foreground' : 'bg-primary/10 text-primary'}>
                        {conv.type === 'group'
                          ? <UsersIcon className="w-5 h-5" />
                          : getInitials(conv.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={['font-semibold text-sm truncate', isSelected ? 'text-primary-foreground' : 'text-foreground'].join(' ')}>
                          {conv.name}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {conv.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                              {conv.unreadCount}
                            </span>
                          )}
                          {conv.lastMessageTime && (
                            <span className={['text-[10px]', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'].join(' ')}>
                              {formatConversationTime(conv.lastMessageTime)}
                            </span>
                          )}
                        </div>
                      </div>
                      {conv.lastMessage && (
                        <p className={['text-xs truncate mt-0.5', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'].join(' ')}>
                          {conv.lastMessage}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* Message Thread — full width on mobile, 2/3 on desktop */}
        <Card className={['md:col-span-2 flex flex-col overflow-hidden', !selectedConversationId ? 'hidden md:flex' : 'flex'].join(' ')}>
          {!selectedConversationId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Select a conversation to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header — desktop only (mobile uses the back header above) */}
              <div className="hidden md:flex items-center gap-3 p-4 border-b border-border">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {selectedConversation?.type === 'group'
                      ? <UsersIcon className="w-5 h-5" />
                      : getInitials(selectedConversation?.name || '?')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-foreground">{selectedConversation?.name}</p>
                  {selectedConversation?.type === 'group' && (
                    <p className="text-xs text-muted-foreground">All families and instructors</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {currentMessages.map((msg) => {
                    const isOwn = msg.authorId === user.id;
                    return (
                      <div key={msg.id} className={['flex gap-2', isOwn ? 'justify-end' : 'justify-start'].join(' ')}>
                        {!isOwn && (
                          <Avatar className="h-7 w-7 shrink-0 mt-1">
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                              {getInitials(msg.authorName || '?')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={['max-w-[75%]', isOwn ? 'items-end' : 'items-start', 'flex flex-col gap-0.5'].join(' ')}>
                          {!isOwn && (
                            <p className="text-xs font-semibold text-amber-600 ml-1">{msg.authorName}</p>
                          )}
                          <div className={[
                            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                            isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted text-foreground rounded-bl-sm',
                          ].join(' ')}>
                            {msg.attachmentName ? (
                              <button
                                onClick={() => handleOpenAttachment(msg)}
                                disabled={openingAttachmentId === msg.id}
                                className={['flex items-center gap-1.5 underline text-sm', isOwn ? 'text-primary-foreground' : 'text-primary'].join(' ')}
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                {openingAttachmentId === msg.id ? 'Opening...' : msg.attachmentName}
                              </button>
                            ) : (
                              msg.body
                            )}
                          </div>
                          <p className={['text-[10px] px-1', isOwn ? 'text-right text-muted-foreground' : 'text-muted-foreground'].join(' ')}>
                            {formatMessageTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input area */}
              <div className="p-3 border-t border-border">
                {!canSend && (
                  <p className="text-xs text-muted-foreground mb-2 text-center">
                    Direct messages are available for family-to-staff conversations only.
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    disabled={!canSend || uploadingFile}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach file"
                  >
                    {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  </Button>
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={canSend ? 'Type a message...' : 'Cannot send in this conversation'}
                    disabled={!canSend || sending}
                    className="flex-1 h-10 text-sm"
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    disabled={!messageText.trim() || !canSend || sending}
                    onClick={handleSend}
                    aria-label="Send message"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
