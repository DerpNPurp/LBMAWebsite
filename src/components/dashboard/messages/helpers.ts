export type MessageRecord = {
  message_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
  profiles?: { display_name?: string | null; avatar_url?: string | null } | null;
  message_attachments?: Array<{
    file_name?: string | null;
    storage_path?: string | null;
  }> | null;
};

export type MessageListItem = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string;
  attachmentName?: string;
  attachmentPath?: string;
};

export function isDirectConversationAllowed(currentUserRole: 'admin' | 'family', otherRole?: string) {
  if (!otherRole) return false;
  if (currentUserRole === 'family') return otherRole === 'admin';
  return otherRole === 'family' || otherRole === 'admin';
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Unknown error');
  }
  return 'Unknown error';
}

export function calculateUnreadCount(messagesData: Array<{ author_user_id: string; created_at: string }>, userId: string, lastReadAt?: string | null) {
  return messagesData.filter((message) => {
    if (message.author_user_id === userId) return false;
    if (!lastReadAt) return true;
    return new Date(message.created_at).getTime() > new Date(lastReadAt).getTime();
  }).length;
}

export function formatMessages(messagesData: MessageRecord[]): MessageListItem[] {
  return messagesData.map((message) => ({
    id: message.message_id,
    authorId: message.author_user_id,
    authorName: message.profiles?.display_name || 'Unknown',
    authorAvatarUrl: message.profiles?.avatar_url ?? null,
    body: message.body,
    createdAt: message.created_at,
    attachmentName: message.message_attachments?.[0]?.file_name || undefined,
    attachmentPath: message.message_attachments?.[0]?.storage_path || undefined,
  }));
}

export function formatConversationTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatMessageTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
