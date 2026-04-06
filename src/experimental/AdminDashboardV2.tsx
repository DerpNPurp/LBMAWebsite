import { useEffect, useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '../components/ui/sidebar';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { AdminAnnouncementsTab } from '../components/admin/AdminAnnouncementsTab';
import { AdminBlogTab } from '../components/admin/AdminBlogTab';
import { AdminMessagesTab } from '../components/admin/AdminMessagesTab';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import { FeedbackTab as AdminFeedbackTab } from '../components/admin/FeedbackTab';
import { AdminEnrollmentLeadsTab } from '../components/admin/AdminEnrollmentLeadsTab';
import { AdminProfileTab } from '../components/admin/AdminProfileTab';
import { getUnreadMessageCount } from '../lib/supabase/queries';
import {
  Award,
  Bell,
  BookOpen,
  ClipboardList,
  LogOut,
  MessageSquare,
  Shield,
  UserCircle,
  Users,
} from 'lucide-react';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'family';
  displayName: string;
};

type AdminDashboardV2Props = {
  user: User;
  onLogout: () => void;
};

type AdminTabId =
  | 'announcements'
  | 'blog'
  | 'messages'
  | 'families'
  | 'feedback'
  | 'leads'
  | 'profile';

const navGroups: {
  label: string;
  items: { id: AdminTabId; label: string; icon: React.ElementType }[];
}[] = [
  {
    label: 'Communications',
    items: [
      { id: 'announcements', label: 'Announcements', icon: Bell },
      { id: 'blog', label: 'Parent Blog', icon: BookOpen },
      { id: 'messages', label: 'Messages', icon: MessageSquare },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: 'families', label: 'Families', icon: Users },
      { id: 'feedback', label: 'Student Feedback', icon: Award },
    ],
  },
  {
    label: 'Enrollment',
    items: [{ id: 'leads', label: 'Enrollment Leads', icon: ClipboardList }],
  },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getTabLabel(id: AdminTabId): string {
  for (const group of navGroups) {
    const item = group.items.find((i) => i.id === id);
    if (item) return item.label;
  }
  return 'Profile';
}

export function AdminDashboardV2({ user, onLogout }: AdminDashboardV2Props) {
  const [activeTab, setActiveTab] = useState<AdminTabId>('announcements');
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    getUnreadMessageCount(user.id)
      .then(setUnreadMessages)
      .catch(console.error);
  }, [user.id]);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        {/* ── Brand header ── */}
        <SidebarHeader className="px-3 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
              <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold leading-none text-sidebar-foreground">LBMAA</span>
              <span className="mt-0.5 text-xs text-sidebar-foreground/60">Admin Portal</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        {/* ── Grouped navigation ── */}
        <SidebarContent className="py-2">
          {navGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map(({ id, label, icon: Icon }) => (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton
                        isActive={activeTab === id}
                        onClick={() => setActiveTab(id)}
                        tooltip={label}
                        size="lg"
                        className={
                          activeTab === id
                            ? 'border-l-[3px] border-sidebar-primary rounded-tl-none rounded-bl-none pl-[calc(0.5rem-3px)]'
                            : ''
                        }
                      >
                        <Icon />
                        <span>{label}</span>
                      </SidebarMenuButton>
                      {id === 'messages' && unreadMessages > 0 && (
                        <SidebarMenuBadge className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                          {unreadMessages}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        {/* ── User footer ── */}
        <SidebarFooter className="pb-4">
          <SidebarSeparator className="mb-2" />

          {/* Expanded state */}
          <div className="px-2 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 rounded-lg px-2 py-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-none text-sidebar-foreground">
                  {user.displayName}
                </p>
                <p className="mt-0.5 truncate text-xs text-sidebar-foreground/60">{user.email}</p>
              </div>
            </div>
            <div className="mt-1 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                onClick={() => setActiveTab('profile')}
              >
                <UserCircle className="mr-1.5 h-4 w-4" />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                onClick={onLogout}
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Collapsed state: icon-only */}
          <div className="hidden flex-col items-center gap-1 group-data-[collapsible=icon]:flex">
            <button
              onClick={() => setActiveTab('profile')}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              aria-label="Profile"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={onLogout}
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* ── Main content area ── */}
      <SidebarInset>
        {/* Sticky top bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground" />
          <div className="h-5 w-px bg-border" />
          <h1 className="text-base font-semibold text-foreground">
            {getTabLabel(activeTab)}
          </h1>
          <div className="flex-1" />
          <span className="hidden text-sm text-muted-foreground md:block">
            {user.displayName}
          </span>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'announcements' && <AdminAnnouncementsTab user={user} />}
          {activeTab === 'blog' && <AdminBlogTab user={user} />}
          {activeTab === 'messages' && (
            <AdminMessagesTab user={user} onUnreadCountChange={setUnreadMessages} />
          )}
          {activeTab === 'families' && <AdminUsersTab user={user} />}
          {activeTab === 'feedback' && <AdminFeedbackTab />}
          {activeTab === 'leads' && <AdminEnrollmentLeadsTab />}
          {activeTab === 'profile' && (
            <AdminProfileTab user={user} onClose={() => setActiveTab('announcements')} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
