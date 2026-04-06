import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '../ui/use-mobile';
import { V2Sidebar, type V2SectionId } from './v2/layout/V2Sidebar';
import { V2BottomNav } from './v2/layout/V2BottomNav';
import { V2TopBar } from './v2/layout/V2TopBar';
import { V2HomeTab } from './v2/home/V2HomeTab';
import { V2AnnouncementsTab } from './v2/announcements/V2AnnouncementsTab';
import { V2MessagesTab } from './v2/messages/V2MessagesTab';
import { V2FeedbackTab } from './v2/feedback/V2FeedbackTab';
import { V2BlogTab } from './v2/blog/V2BlogTab';
import { V2ReviewTab } from './v2/reviews/V2ReviewTab';
import { V2ProfileTab } from './v2/profile/V2ProfileTab';
import { V2ScheduleTab } from './v2/schedule/V2ScheduleTab';
import { getUnreadMessageCount } from '../../lib/supabase/queries';
import type { User } from '../../lib/types';

type FamilyDashboardV2Props = {
  user: NonNullable<User>;
  onLogout: () => void;
};

export function FamilyDashboardV2({ user, onLogout }: FamilyDashboardV2Props) {
  const isMobile = useIsMobile();
  // Tablet = not mobile but less than 1024px
  const [isTablet, setIsTablet] = useState(false);
  const [activeSection, setActiveSection] = useState<V2SectionId>('home');
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const checkTablet = () => {
      const w = window.innerWidth;
      setIsTablet(w >= 768 && w < 1024);
    };
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadMessageCount(user.id);
      setUnreadMessages(count);
    } catch {
      // non-fatal
    }
  }, [user.id]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Re-poll unread count whenever leaving messages tab
  useEffect(() => {
    if (activeSection !== 'messages') {
      fetchUnreadCount();
    }
  }, [activeSection, fetchUnreadCount]);

  const handleUnreadCountChange = (count: number) => {
    setUnreadMessages(count);
  };

  const showSidebar = !isMobile && !isTablet;
  const showTopBar = isMobile || isTablet;
  const showBottomNav = isMobile;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      {showSidebar && (
        <V2Sidebar
          activeSection={activeSection}
          onNavigate={setActiveSection}
          unreadMessages={unreadMessages}
          userName={user.displayName}
          userEmail={user.email}
          onLogout={onLogout}
          onProfile={() => setActiveSection('profile')}
        />
      )}

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Topbar (tablet + mobile only) */}
        {showTopBar && (
          <V2TopBar
            isTablet={isTablet || isMobile}
            activeSection={activeSection}
            onNavigate={setActiveSection}
            unreadMessages={unreadMessages}
            userName={user.displayName}
            userEmail={user.email}
            onLogout={onLogout}
          />
        )}

        {/* Scrollable content */}
        <main
          className={[
            'flex-1 overflow-y-auto',
            showBottomNav ? 'pb-20' : 'pb-8',
          ].join(' ')}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {activeSection === 'home' && (
              <V2HomeTab user={user} onNavigate={setActiveSection} />
            )}
            {activeSection === 'announcements' && (
              <V2AnnouncementsTab user={user} />
            )}
            {activeSection === 'messages' && (
              <V2MessagesTab user={user} onUnreadCountChange={handleUnreadCountChange} />
            )}
            {activeSection === 'feedback' && (
              <V2FeedbackTab user={user} />
            )}
            {activeSection === 'blog' && (
              <V2BlogTab user={user} />
            )}
            {activeSection === 'reviews' && (
              <V2ReviewTab user={user} />
            )}
            {activeSection === 'profile' && (
              <V2ProfileTab user={user} />
            )}
            {activeSection === 'schedule' && (
              <V2ScheduleTab />
            )}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      {showBottomNav && (
        <V2BottomNav
          activeSection={activeSection}
          onNavigate={setActiveSection}
          unreadMessages={unreadMessages}
          userName={user.displayName}
          onLogout={onLogout}
        />
      )}
    </div>
  );
}
