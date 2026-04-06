import { useState } from 'react';
import {
  House,
  Megaphone,
  MessageCircle,
  ClipboardList,
  Ellipsis,
  BookOpen,
  Star,
  UserCircle,
  LogOut,
  CalendarDays,
} from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../ui/sheet';
import type { V2SectionId } from './V2Sidebar';
import { Avatar, AvatarFallback } from '../../../ui/avatar';

type BottomNavItem = {
  id: V2SectionId | 'more';
  label: string;
  icon: React.ElementType;
};

const bottomNavItems: BottomNavItem[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'announcements', label: 'Updates', icon: Megaphone },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'feedback', label: 'Feedback', icon: ClipboardList },
  { id: 'more', label: 'More', icon: Ellipsis },
];

const moreItems: { id: V2SectionId; label: string; icon: React.ElementType }[] = [
  { id: 'blog', label: 'Parent Blog', icon: BookOpen },
  { id: 'reviews', label: 'Write a Review', icon: Star },
  { id: 'schedule', label: 'Class Schedule', icon: CalendarDays },
  { id: 'profile', label: 'My Profile', icon: UserCircle },
];

type V2BottomNavProps = {
  activeSection: V2SectionId;
  onNavigate: (section: V2SectionId) => void;
  unreadMessages: number;
  userName: string;
  onLogout: () => void;
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function V2BottomNav({
  activeSection,
  onNavigate,
  unreadMessages,
  userName,
  onLogout,
}: V2BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  const moreIds = moreItems.map((i) => i.id);
  const moreIsActive = moreIds.includes(activeSection as V2SectionId);

  const handleNavClick = (id: V2SectionId | 'more') => {
    if (id === 'more') {
      setMoreOpen(true);
    } else {
      onNavigate(id);
    }
  };

  const handleMoreNavigate = (id: V2SectionId) => {
    onNavigate(id);
    setMoreOpen(false);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#1B1212] border-t border-sidebar-border safe-area-pb">
        <div className="flex items-stretch">
          {bottomNavItems.map((item) => {
            const isActive =
              item.id === 'more' ? moreIsActive : activeSection === item.id;
            const Icon = item.icon;
            const badge = item.id === 'messages' && unreadMessages > 0 ? unreadMessages : 0;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={[
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[64px] transition-colors relative',
                  isActive
                    ? 'text-primary border-t-2 border-primary -mt-px'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground',
                ].join(' ')}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* "More" Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="bg-[#1B1212] border-sidebar-border rounded-t-2xl pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-sidebar-foreground">More options</SheetTitle>
          </SheetHeader>

          {/* User info */}
          <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-sidebar-accent/50">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sidebar-foreground font-medium text-sm">{userName}</p>
              <p className="text-sidebar-foreground/50 text-xs">Family Account</p>
            </div>
          </div>

          <div className="space-y-1 mb-4">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMoreNavigate(item.id)}
                  className={[
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  ].join(' ')}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => { setMoreOpen(false); onLogout(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/30 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
}
