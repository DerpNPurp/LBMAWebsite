import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './client';

export type RealtimeCallback<T> = (payload: T) => void;

// ============================================
// ANNOUNCEMENTS
// ============================================

export function subscribeToAnnouncements(
  callback: RealtimeCallback<{ eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new?: any; old?: any }>
): RealtimeChannel {
  const channel = supabase
    .channel('announcements-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'announcements',
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new,
          old: payload.old,
        });
      }
    )
    .subscribe();

  return channel;
}

export function subscribeToAnnouncementComments(
  announcementId: string,
  callback: RealtimeCallback<{ eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new?: any; old?: any }>
): RealtimeChannel {
  const channel = supabase
    .channel(`announcement-comments-${announcementId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'announcement_comments',
        filter: `announcement_id=eq.${announcementId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new,
          old: payload.old,
        });
      }
    )
    .subscribe();

  return channel;
}

// ============================================
// BLOG POSTS
// ============================================

export function subscribeToBlogPosts(
  callback: RealtimeCallback<{ eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new?: any; old?: any }>
): RealtimeChannel {
  const channel = supabase
    .channel('blog-posts-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'blog_posts',
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new,
          old: payload.old,
        });
      }
    )
    .subscribe();

  return channel;
}

export function subscribeToBlogComments(
  postId: string,
  callback: RealtimeCallback<{ eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new?: any; old?: any }>
): RealtimeChannel {
  const channel = supabase
    .channel(`blog-comments-${postId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'blog_comments',
        filter: `post_id=eq.${postId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new,
          old: payload.old,
        });
      }
    )
    .subscribe();

  return channel;
}

// ============================================
// MESSAGES
// ============================================

export function subscribeToMessages(
  conversationId: string,
  callback: RealtimeCallback<{ eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new?: any; old?: any }>
): RealtimeChannel {
  const channel = supabase
    .channel(`messages-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new,
          old: payload.old,
        });
      }
    )
    .subscribe();

  return channel;
}

export function subscribeToConversations(
  callback: RealtimeCallback<{ eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new?: any; old?: any }>
): RealtimeChannel {
  const channel = supabase
    .channel('conversations-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new,
          old: payload.old,
        });
      }
    )
    .subscribe();

  return channel;
}

// ============================================
// REVIEWS
// ============================================

export function subscribeToReviews(
  callback: RealtimeCallback<{ eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new?: any; old?: any }>
): RealtimeChannel {
  const channel = supabase
    .channel('reviews-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reviews',
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new,
          old: payload.old,
        });
      }
    )
    .subscribe();

  return channel;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function unsubscribe(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
