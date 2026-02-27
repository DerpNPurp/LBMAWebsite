import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { HomeTab } from './dashboard/HomeTab';
import { AnnouncementsTab } from './dashboard/AnnouncementsTab';
import { BlogTab } from './dashboard/BlogTab';
import { MessagesTab } from './dashboard/MessagesTab';
import { ProfileTab } from './dashboard/ProfileTab';
import { FeedbackTab } from './dashboard/FeedbackTab';
import { LogOut, Bell, MessageSquare, Users, UserCircle, Home } from 'lucide-react';
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

type User = {
  id: string;
  email: string;
  role: 'admin' | 'family';
  displayName: string;
};

type DashboardProps = {
  user: User;
  onLogout: () => void;
};

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [unreadMessages] = useState(3); // Mock unread count

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

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
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTab('profile')}>
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
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
                <Badge className="ml-1 h-5 px-1.5 text-xs bg-primary">
                  {unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

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
            <MessagesTab user={user} />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab user={user} />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileTab user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}