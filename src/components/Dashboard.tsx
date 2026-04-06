import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { HomeTab } from './dashboard/HomeTab';
import { AnnouncementsTab } from './dashboard/AnnouncementsTab';
import { BlogTab } from './dashboard/BlogTab';
import { MessagesTab } from './dashboard/MessagesTab';
import { ProfileTab } from './dashboard/ProfileTab';
import { FeedbackTab } from './dashboard/FeedbackTab';
import { ReviewTab } from './dashboard/ReviewTab';
import { LogOut, Bell, MessageSquare, Users, UserCircle, Home, Award, Star } from 'lucide-react';
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
import type { User } from '../lib/types';

type DashboardProps = {
  user: NonNullable<User>;
  onLogout: () => void;
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [unreadMessages, setUnreadMessages] = useState(0);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b border-primary/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">LBMAA Parent Portal</h1>
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
                <DropdownMenuItem onClick={() => setActiveTab('profile')}>
                  <UserCircle className="w-4 h-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('reviews')}>
                  <Star className="w-4 h-4 mr-2" />
                  Write a Review
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop tab bar — 6 tabs */}
          <TabsList className="hidden md:grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Parent Blog
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2 relative">
              <MessageSquare className="w-4 h-4" />
              Messages
              {unreadMessages > 0 && (
                <Badge className="ml-1 h-5 px-1.5 text-xs bg-destructive text-destructive-foreground">
                  {unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Reviews
            </TabsTrigger>
          </TabsList>

          {/* Mobile tab bar — 5 primary tabs; Reviews accessible via profile dropdown */}
          <div className="md:hidden mb-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="home" className="flex flex-col items-center gap-1 py-2 text-xs">
                <Home className="w-4 h-4" />
                Home
              </TabsTrigger>
              <TabsTrigger value="announcements" className="flex flex-col items-center gap-1 py-2 text-xs">
                <Bell className="w-4 h-4" />
                Updates
              </TabsTrigger>
              <TabsTrigger value="blog" className="flex flex-col items-center gap-1 py-2 text-xs">
                <Users className="w-4 h-4" />
                Blog
              </TabsTrigger>
              <TabsTrigger value="messages" className="relative flex flex-col items-center gap-1 py-2 text-xs">
                <MessageSquare className="w-4 h-4" />
                Messages
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-destructive" />
                )}
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex flex-col items-center gap-1 py-2 text-xs">
                <Award className="w-4 h-4" />
                Feedback
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="home">
            <HomeTab user={user} onNavigate={setActiveTab} />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsTab user={user} />
          </TabsContent>

          <TabsContent value="blog">
            <BlogTab user={user} />
          </TabsContent>

          <TabsContent value="messages">
            <MessagesTab user={user} onUnreadCountChange={setUnreadMessages} />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab user={user} />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewTab user={user} />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileTab user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
