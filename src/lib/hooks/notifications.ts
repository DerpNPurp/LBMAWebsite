import { useQuery } from '@tanstack/react-query';
import {
  getNotificationSummary,
  getSectionUnreadCounts,
  getUnreadMessageCount,
} from '../supabase/queries';
import { queryKeys } from '../queryKeys';

export function useNotificationSummary(userId: string) {
  return useQuery({
    queryKey: queryKeys.notificationSummary(userId),
    queryFn: () => getNotificationSummary(userId),
  });
}

export function useSidebarCounts(userId: string) {
  return useQuery({
    queryKey: queryKeys.sidebarCounts(userId),
    queryFn: async () => {
      const [{ announcements, blog }, unreadMessages] = await Promise.all([
        getSectionUnreadCounts(userId),
        getUnreadMessageCount(),
      ]);
      return { unreadMessages, unreadAnnouncements: announcements, unreadBlog: blog };
    },
  });
}

export function useHomeCounts(userId: string) {
  return useQuery({
    queryKey: queryKeys.homeCounts(userId),
    queryFn: async () => {
      const [{ announcements, blog }, unreadMessages] = await Promise.all([
        getSectionUnreadCounts(userId),
        getUnreadMessageCount(),
      ]);
      return { unreadMessages, announcementCount: announcements, blogCount: blog };
    },
  });
}
