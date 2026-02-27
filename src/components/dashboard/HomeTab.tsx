import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Bell, BookOpen, MessageSquare, User, Calendar, Trophy, Pin, Award } from 'lucide-react';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'family';
  displayName: string;
};

type Student = {
  id: string;
  name: string;
  age: number;
  beltLevel: string;
  nextClass: string;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  isPinned?: boolean;
};

type BlogPost = {
  id: string;
  title: string;
  authorName: string;
  createdAt: string;
  commentCount: number;
  isPinned?: boolean;
};

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Emma Johnson',
    age: 8,
    beltLevel: 'Yellow Belt',
    nextClass: 'Today at 4:00 PM'
  },
  {
    id: '2',
    name: 'Lucas Johnson',
    age: 6,
    beltLevel: 'White Belt',
    nextClass: 'Tomorrow at 3:30 PM'
  }
];

const mockRecentAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Belt Testing Scheduled for March 15th',
    body: 'We are excited to announce that our next belt testing will take place on Saturday, March 15th at 10:00 AM.',
    authorName: 'Master Reyes',
    createdAt: '2026-02-01T10:00:00Z',
    isPinned: true
  },
  {
    id: '2',
    title: 'Facility Closed for Maintenance - Feb 10th',
    body: 'Our facility will be closed on Monday, February 10th for scheduled maintenance and deep cleaning.',
    authorName: 'Admin Team',
    createdAt: '2026-01-28T09:00:00Z'
  }
];

const mockRecentBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Tips for Practicing at Home',
    authorName: 'Jennifer Martinez',
    createdAt: '2026-02-03T14:00:00Z',
    commentCount: 12,
    isPinned: true
  },
  {
    id: '2',
    title: 'Anyone Carpooling to Saturday Classes?',
    authorName: 'Michael Torres',
    createdAt: '2026-02-02T19:00:00Z',
    commentCount: 8
  }
];

type HomeTabProps = {
  user: User;
  onNavigate: (tab: string) => void;
};

export function HomeTab({ user, onNavigate }: HomeTabProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const unreadMessages = 3; // Mock unread count
  const newFeedbackCount = 2; // Mock feedback count
  const newAnnouncementsCount = mockRecentAnnouncements.length;

  const notifications = [
    {
      type: 'feedback',
      count: newFeedbackCount,
      label: 'New Feedback',
      icon: Award,
      action: () => onNavigate('feedback')
    },
    {
      type: 'messages',
      count: unreadMessages,
      label: 'Unread Messages',
      icon: MessageSquare,
      action: () => onNavigate('messages')
    },
    {
      type: 'announcements',
      count: newAnnouncementsCount,
      label: 'New Announcements',
      icon: Bell,
      action: () => onNavigate('announcements')
    }
  ];

  const totalNotifications = newFeedbackCount + unreadMessages + newAnnouncementsCount;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h2 className="text-4xl font-bold">Welcome back, {user.displayName.split(' ')[0]}! 👋</h2>
        <p className="text-muted-foreground text-lg">
          Here's what's happening with your family at LBMAA
        </p>
      </div>

      {/* New Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>New Notifications</CardTitle>
              <CardDescription>
                {totalNotifications} {totalNotifications === 1 ? 'update' : 'updates'} waiting for you
              </CardDescription>
            </div>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <button
                  key={notification.type}
                  onClick={notification.action}
                  className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold">{notification.count}</div>
                    <div className="text-sm text-muted-foreground">{notification.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Students Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Students</CardTitle>
              <CardDescription>Quick overview of your children's progress</CardDescription>
            </div>
            <Button variant="outline" onClick={() => onNavigate('profile')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {mockStudents.map((student) => (
              <Card key={student.id} className="bg-secondary/50">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-lg">
                        {getInitials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{student.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">Age {student.age}</p>
                      <div className="mt-2">
                        <Badge variant="secondary" className="gap-1">
                          <Trophy className="w-3 h-3" />
                          {student.beltLevel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => onNavigate('feedback')}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    View Feedback
                  </Button>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}