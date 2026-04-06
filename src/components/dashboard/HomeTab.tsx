import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Bell, Loader2, MessageSquare, Trophy, Pin, Award, Star } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import {
  getAnnouncements,
  getBlogPosts,
  getCommunicationCounts,
  getStudentFeedbackByFamily,
} from '../../lib/supabase/queries';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'family';
  displayName: string;
};

type Student = {
  id: string;
  name: string;
  age: number | null;
  beltLevel: string;
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
  isPinned: boolean;
};

type AnnouncementRecord = {
  announcement_id: string;
  title: string;
  body: string;
  created_at: string;
  is_pinned?: boolean;
  profiles?: { display_name?: string | null } | null;
};

type BlogPostRecord = {
  post_id: string;
  title: string;
  created_at: string;
  is_pinned?: boolean;
  profiles?: { display_name?: string | null } | null;
};

type HomeTabProps = {
  user: User;
  onNavigate: (tab: string) => void;
};

export function HomeTab({ user, onNavigate }: HomeTabProps) {
  const {
    family,
    students: profileStudents,
    review,
    loading: profileLoading,
    error: profileError,
    reload: reloadProfile,
  } = useProfile(user);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getAgeFromDob = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const students: Student[] = profileStudents.map((student) => ({
    id: student.student_id,
    name: `${student.first_name} ${student.last_name}`.trim(),
    age: getAgeFromDob(student.date_of_birth),
    beltLevel: student.belt_level || 'No belt assigned',
  }));

  const loadHomeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [announcementsResult, blogPostsResult, communicationCountsResult] = await Promise.allSettled([
        getAnnouncements(),
        getBlogPosts(),
        getCommunicationCounts(user.id),
      ]);

      if (announcementsResult.status === 'rejected') throw announcementsResult.reason;
      if (blogPostsResult.status === 'rejected') throw blogPostsResult.reason;
      if (communicationCountsResult.status === 'rejected') throw communicationCountsResult.reason;

      const announcementsData = announcementsResult.value;
      const blogPostsData = blogPostsResult.value;
      const communicationCounts = communicationCountsResult.value;

      setAnnouncements(
        (announcementsData as AnnouncementRecord[]).slice(0, 3).map((announcement) => ({
          id: announcement.announcement_id,
          title: announcement.title,
          body: announcement.body,
          authorName: announcement.profiles?.display_name || 'Unknown',
          createdAt: announcement.created_at,
          isPinned: announcement.is_pinned || false,
        })),
      );

      setBlogPosts(
        (blogPostsData as BlogPostRecord[]).slice(0, 3).map((post) => ({
          id: post.post_id,
          title: post.title,
          authorName: post.profiles?.display_name || 'Unknown',
          createdAt: post.created_at,
          isPinned: Boolean(post.is_pinned),
        })),
      );
      setUnreadMessages(communicationCounts.unreadMessages);
      setAnnouncementCount(communicationCounts.announcements);
    } catch (err) {
      console.error('Error loading home dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load home dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  // Load feedback count once family is known
  useEffect(() => {
    if (!family?.family_id) return;
    getStudentFeedbackByFamily(family.family_id)
      .then((data) => setFeedbackCount(data.length))
      .catch(() => {}); // non-critical
  }, [family?.family_id]);

  const newFeedbackCount = feedbackCount;
  const newAnnouncementsCount = announcementCount;

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

  const isLoading = loading || profileLoading;
  const loadError = error || profileError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load your dashboard</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              reloadProfile();
              loadHomeData();
            }}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

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
                  className={`flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left ${
                    notification.count > 0 ? 'ring-2 ring-primary/40 bg-primary/5' : ''
                  }`}
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
          {students.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No students on file yet. Add your student details in Profile to get started.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {students.map((student) => (
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
                      <p className="text-sm text-muted-foreground">
                        {student.age === null ? 'Age not available' : `Age ${student.age}`}
                      </p>
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
          )}
        </CardContent>
      </Card>

      {/* Review nudge — only shown when family has no review yet */}
      {!review && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="flex items-center justify-between gap-4 pt-5 pb-5">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm">
                <span className="font-medium">Enjoying LBMAA?</span>{' '}
                Leave a quick review — it helps other families find us.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onNavigate('reviews')} className="flex-shrink-0">
              Write a Review
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Announcements</CardTitle>
                <CardDescription>Latest updates from instructors and staff</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => onNavigate('announcements')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements available right now.</p>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="space-y-1 border-b pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    {announcement.isPinned && <Pin className="w-3.5 h-3.5 text-primary" />}
                    <p className="font-medium">{announcement.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{announcement.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {announcement.authorName} • {formatDate(announcement.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Blog Posts</CardTitle>
                <CardDescription>Latest family community discussions</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => onNavigate('blog')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {blogPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No blog posts available right now.</p>
            ) : (
              blogPosts.map((post) => (
                <div key={post.id} className="space-y-1 border-b pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    {post.isPinned && <Pin className="w-3.5 h-3.5 text-primary" />}
                    <p className="font-medium">{post.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {post.authorName} • {formatDate(post.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}