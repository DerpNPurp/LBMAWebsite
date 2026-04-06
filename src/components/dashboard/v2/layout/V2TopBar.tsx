import { useState } from 'react';
import { Menu, Shield, BookOpen, Star, UserCircle, CalendarDays } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../ui/sheet';
import type { V2SectionId } from './V2Sidebar';
import { V2Sidebar } from './V2Sidebar';

const SECTION_LABELS: Record<V2SectionId, string> = {
  home: 'Home',
  announcements: 'Announcements',
  messages: 'Messages',
  feedback: 'Instructor Feedback',
  blog: 'Parent Blog',
  reviews: 'Write a Review',
  profile: 'My Profile',
  schedule: 'Class Schedule',
};

type V2TopBarProps = {
  isTablet: boolean;
  activeSection: V2SectionId;
  onNavigate: (section: V2SectionId) => void;
  unreadMessages: number;
  userName: string;
  userEmail: string;
  onLogout: () => void;
};

export function V2TopBar({
  isTablet,
  activeSection,
  onNavigate,
  unreadMessages,
  userName,
  userEmail,
  onLogout,
}: V2TopBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNavigate = (section: V2SectionId) => {
    onNavigate(section);
    setDrawerOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center px-4 gap-3 bg-background/95 backdrop-blur border-b border-border">
      {isTablet && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {isTablet && (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm text-foreground">LBMAA</span>
        </div>
      )}

      <h2 className="text-base font-semibold text-foreground">
        {SECTION_LABELS[activeSection]}
      </h2>

      {/* Tablet slide-in drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-[#1B1212] border-sidebar-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="h-full">
            <V2Sidebar
              activeSection={activeSection}
              onNavigate={handleNavigate}
              unreadMessages={unreadMessages}
              userName={userName}
              userEmail={userEmail}
              onLogout={onLogout}
              onProfile={() => handleNavigate('profile')}
            />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
