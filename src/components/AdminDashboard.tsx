import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { AdminAnnouncementsTab } from './admin/AdminAnnouncementsTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminMessagesTab } from './admin/AdminMessagesTab';
import { AdminBlogTab } from './admin/AdminBlogTab';
import { FeedbackTab as AdminFeedbackTab } from './admin/FeedbackTab';
import { AdminEnrollmentLeadsTab } from './admin/AdminEnrollmentLeadsTab';
import { AdminProfileTab } from './admin/AdminProfileTab';
import { LogOut, Bell, Users, MessageSquare, Shield, BookOpen, MessagesSquare, UserCog, Award, UserCircle, ClipboardList } from 'lucide-react';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { getUnreadMessageCount } from '../lib/supabase/queries';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'family';
  displayName: string;
};

type AdminDashboardProps = {
  user: User;
  onLogout: () => void;
};

type MainSection = 'communications' | 'management' | 'leads';

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<MainSection>('communications');
  const [activeTab, setActiveTab] = useState('announcements');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const loadUnreadMessages = async () => {
      try {
        const count = await getUnreadMessageCount(user.id);
        setUnreadMessages(count);
      } catch (error) {
        console.error('Failed to load unread message count:', error);
      }
    };

    loadUnreadMessages();
  }, [user.id]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b border-primary/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6" />
                <h1 className="text-2xl font-bold">LBMAA Admin Portal</h1>
              </div>
              <p className="text-sm opacity-90">Welcome, {user.displayName}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-background focus:ring-offset-2 focus:ring-offset-primary">
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarFallback className="bg-background text-primary font-semibold">
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowProfile(true)}>
                  <UserCircle className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <div className="bg-secondary border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <Button
              variant={activeSection === 'communications' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${
                activeSection === 'communications' 
                  ? 'border-primary' 
                  : 'border-transparent'
              }`}
              onClick={() => {
                setActiveSection('communications');
                setActiveTab('announcements');
              }}
            >
              <MessagesSquare className="w-4 h-4 mr-2" />
              Communications
            </Button>
            <Button
              variant={activeSection === 'management' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${
                activeSection === 'management'
                  ? 'border-primary'
                  : 'border-transparent'
              }`}
              onClick={() => {
                setActiveSection('management');
                setActiveTab('families');
              }}
            >
              <UserCog className="w-4 h-4 mr-2" />
              Management
            </Button>
            <Button
              variant={activeSection === 'leads' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${
                activeSection === 'leads'
                  ? 'border-primary'
                  : 'border-transparent'
              }`}
              onClick={() => setActiveSection('leads')}
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Enrollment Leads
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {showProfile ? (
          <AdminProfileTab user={user} onClose={() => setShowProfile(false)} />
        ) : (
          <>
            {activeSection === 'communications' && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger value="announcements" className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Announcements
                  </TabsTrigger>
                  <TabsTrigger value="blog" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Parent Blog
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="flex items-center gap-2 relative">
                    <MessageSquare className="w-4 h-4" />
                    Messages
                    {unreadMessages > 0 && (
                      <Badge className="ml-1 h-5 px-1.5 text-xs bg-primary">
                        {unreadMessages}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="announcements">
                  <AdminAnnouncementsTab user={user} />
                </TabsContent>

                <TabsContent value="blog">
                  <AdminBlogTab user={user} />
                </TabsContent>

                <TabsContent value="messages">
                  <AdminMessagesTab user={user} onUnreadCountChange={setUnreadMessages} />
                </TabsContent>
              </Tabs>
            )}

            {activeSection === 'leads' && (
              <AdminEnrollmentLeadsTab />
            )}

            {activeSection === 'management' && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md">
                  <TabsTrigger value="families" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Family Management
                  </TabsTrigger>
                  <TabsTrigger value="feedback" className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Student Feedback
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="families">
                  <AdminUsersTab user={user} />
                </TabsContent>

                <TabsContent value="feedback">
                  <AdminFeedbackTab />
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
    </div>
  );
}