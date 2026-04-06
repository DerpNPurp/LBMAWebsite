import {
  House,
  Megaphone,
  MessageCircle,
  ClipboardList,
  BookOpen,
  Star,
  UserCircle,
  LogOut,
  Shield,
  Phone,
  Mail,
  CalendarDays,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../../../ui/avatar';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Separator } from '../../../ui/separator';

export type V2SectionId =
  | 'home'
  | 'announcements'
  | 'messages'
  | 'feedback'
  | 'blog'
  | 'reviews'
  | 'profile'
  | 'schedule';

type NavItem = {
  id: V2SectionId;
  label: string;
  icon: React.ElementType;
};

const primaryNav: NavItem[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'feedback', label: 'Feedback', icon: ClipboardList },
];

const communityNav: NavItem[] = [
  { id: 'blog', label: 'Parent Blog', icon: BookOpen },
  { id: 'reviews', label: 'Write a Review', icon: Star },
];

const resourceNav: NavItem[] = [
  { id: 'schedule', label: 'Class Schedule', icon: CalendarDays },
];

type V2SidebarProps = {
  activeSection: V2SectionId;
  onNavigate: (section: V2SectionId) => void;
  unreadMessages: number;
  userName: string;
  userEmail: string;
  onLogout: () => void;
  onProfile: () => void;
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function NavButton({
  item,
  isActive,
  badge,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  badge?: number;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px]',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
      ].join(' ')}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="flex-1 text-left">{item.label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge className="bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full">
          {badge > 99 ? '99+' : badge}
        </Badge>
      )}
    </button>
  );
}

export function V2Sidebar({
  activeSection,
  onNavigate,
  unreadMessages,
  userName,
  userEmail,
  onLogout,
  onProfile,
}: V2SidebarProps) {
  return (
    <aside className="w-64 shrink-0 flex flex-col h-full bg-[#1B1212] overflow-y-auto">
      {/* Brand header */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sidebar-foreground font-bold text-sm leading-tight">LBMAA</p>
            <p className="text-sidebar-foreground/60 text-xs">Family Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {/* My Family */}
        <p className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
          My Family
        </p>
        {primaryNav.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeSection === item.id}
            badge={item.id === 'messages' ? unreadMessages : undefined}
            onClick={() => onNavigate(item.id)}
          />
        ))}

        <Separator className="my-3 bg-sidebar-border" />

        {/* Community */}
        <p className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
          Community
        </p>
        {communityNav.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeSection === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}

        <Separator className="my-3 bg-sidebar-border" />

        {/* Resources */}
        <p className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
          Resources
        </p>
        {resourceNav.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeSection === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      {/* Quick Contact */}
      <div className="mx-3 mb-3 p-3 rounded-lg bg-sidebar-accent/60 border border-sidebar-border">
        <p className="text-xs font-semibold text-sidebar-foreground/60 mb-2 uppercase tracking-wider">Quick Contact</p>
        <a
          href="tel:+15551234567"
          className="flex items-center gap-2 text-sidebar-foreground/80 hover:text-sidebar-foreground text-xs py-1 transition-colors"
        >
          <Phone className="w-3.5 h-3.5" />
          (555) 123-4567
        </a>
        <a
          href="mailto:info@lbmaa.com"
          className="flex items-center gap-2 text-sidebar-foreground/80 hover:text-sidebar-foreground text-xs py-1 transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          info@lbmaa.com
        </a>
      </div>

      {/* User footer */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-sm font-medium truncate">{userName}</p>
            <p className="text-sidebar-foreground/50 text-xs truncate">{userEmail}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onProfile}
            className={[
              'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all min-h-[36px]',
              activeSection === 'profile'
                ? 'bg-primary text-primary-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            ].join(' ')}
          >
            <UserCircle className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-sidebar-foreground/70 hover:bg-red-900/40 hover:text-red-300 transition-all min-h-[36px]"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
