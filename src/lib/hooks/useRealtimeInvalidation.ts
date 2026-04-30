import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  subscribeToAnnouncements,
  subscribeToAllAnnouncementComments,
  subscribeToBlogPosts,
  subscribeToAllBlogComments,
  subscribeToConversations,
  subscribeToAllMessages,
  subscribeToEnrollmentLeads,
  subscribeToUserNotifications,
  unsubscribe,
} from '../supabase/realtime';
import { queryKeys } from '../queryKeys';

export function useRealtimeInvalidation(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channels = [
      subscribeToAnnouncements(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.announcements() });
        queryClient.invalidateQueries({ queryKey: queryKeys.sidebarCounts(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.homeCounts(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.notificationSummary(userId) });
      }),

      subscribeToAllAnnouncementComments(({ new: row }) => {
        if (row?.announcement_id) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.announcementComments(row.announcement_id),
          });
        }
      }),

      subscribeToBlogPosts(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.blogPosts() });
        queryClient.invalidateQueries({ queryKey: queryKeys.sidebarCounts(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.homeCounts(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.notificationSummary(userId) });
      }),

      subscribeToAllBlogComments(({ new: row }) => {
        if (row?.post_id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.blogComments(row.post_id) });
        }
      }),

      subscribeToConversations(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations(userId) });
      }),

      subscribeToAllMessages(({ new: row }) => {
        if (row?.conversation_id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.messages(row.conversation_id) });
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sidebarCounts(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.homeCounts(userId) });
      }),

      subscribeToEnrollmentLeads(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.enrollmentLeads() });
      }),

      subscribeToUserNotifications(userId, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.notificationSummary(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.homeCounts(userId) });
      }),
    ];

    return () => {
      channels.forEach(unsubscribe);
    };
  }, [userId, queryClient]);
}
