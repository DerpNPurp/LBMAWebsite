import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Pin, Star, CalendarDays, ChevronRight, Phone, Mail } from 'lucide-react';
import { useProfile } from '../../../../hooks/useProfile';
import {
  getAnnouncements,
  getBlogPosts,
  getCommunicationCounts,
} from '../../../../lib/supabase/queries';
import { V2NotificationCards } from './V2NotificationCards';
import { V2StudentCard } from './V2StudentCard';
import { V2SkeletonCard } from '../shared/V2SkeletonCard';
import { V2SkeletonList } from '../shared/V2SkeletonList';
import { V2EmptyState } from '../shared/V2EmptyState';
import { Users } from 'lucide-react';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'family';
  displayName: string;
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
};

type V2HomeTabProps = {
  user: User;
  onNavigate: (section: string) => void;
};

const UPCOMING_EVENTS = [
  { label: 'Belt Testing', date: 'April 26, 2026', note: 'All students eligible for promotion' },
  { label: 'Spring Tournament', date: 'May 10, 2026', note: 'Optional — sign up by May 1' },
  { label: 'School Closed', date: 'May 26, 2026', note: 'Memorial Day — no classes' },
];

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export function V2HomeTab({ user, onNavigate }: V2HomeTabProps) {
  const { family, students, review, loading: profileLoading } = useProfile(user);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [contentLoading, setContentLoading] = useState(true);

  const loadContent = useCallback(async () => {
    try {
      const [announcementsData, blogData, counts] = await Promise.all([
        getAnnouncements(),
        getBlogPosts(),
        getCommunicationCounts(user.id),
      ]);

      const formatted = announcementsData.map((a: any) => ({
        id: a.announcement_id,
        title: a.title,
        body: a.body,
        authorName: a.profiles?.display_name || 'Staff',
        createdAt: a.created_at,
        isPinned: a.is_pinned || false,
      }));
      setAnnouncements(formatted.slice(0, 3));

      setBlogPosts(
        blogData.slice(0, 3).map((p: any) => ({
          id: p.post_id,
          title: p.title,
          authorName: p.profiles?.display_name || 'Parent',
          createdAt: p.created_at,
        }))
      );

      setUnreadMessages(counts.unreadMessages || 0);
      setAnnouncementCount(counts.announcements || 0);
    } catch {
      // silently fail — content will just be empty
    } finally {
      setContentLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const firstName = user.displayName?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {firstName}!</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening at LBMAA.</p>
      </div>

      {/* Quick Contact (mobile/compact) */}
      <Card className="bg-[#1B1212] text-sidebar-foreground border-0">
        <CardContent className="py-3 px-4 flex flex-wrap gap-4">
          <a href="tel:+15551234567" className="flex items-center gap-2 text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors">
            <Phone className="w-4 h-4 text-primary" />
            (555) 123-4567
          </a>
          <a href="mailto:info@lbmaa.com" className="flex items-center gap-2 text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors">
            <Mail className="w-4 h-4 text-primary" />
            info@lbmaa.com
          </a>
        </CardContent>
      </Card>

      {/* Notification summary */}
      <V2NotificationCards
        unreadMessages={unreadMessages}
        newFeedback={0}
        newAnnouncements={announcementCount}
        onNavigate={onNavigate as any}
      />

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="w-5 h-5 text-primary" />
              Upcoming Events
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {UPCOMING_EVENTS.map((event, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{event.label}</p>
                <p className="text-primary font-medium text-sm">{event.date}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{event.note}</p>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-1"
            onClick={() => onNavigate('schedule')}
          >
            View Full Class Schedule
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* My Students */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">My Students</h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('profile')}>
            Manage <ChevronRight className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
        {profileLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <V2SkeletonCard lines={3} />
            <V2SkeletonCard lines={3} />
          </div>
        ) : students.length === 0 ? (
          <V2EmptyState
            icon={Users}
            heading="No students added yet"
            body="Add your child's information in your profile to track their progress and belt level."
            action={{ label: 'Go to Profile', onClick: () => onNavigate('profile') }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {students.map((student) => (
              <V2StudentCard
                key={student.student_id}
                studentId={student.student_id}
                firstName={student.first_name}
                lastName={student.last_name}
                age={getAge(student.date_of_birth)}
                beltLevel={student.belt_level || ''}
                status={student.status}
                userId={user.id}
                onViewFeedback={() => onNavigate('feedback')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Review nudge — only show if no review yet */}
      {!profileLoading && !review && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Enjoying LBMAA?</p>
              <p className="text-sm text-muted-foreground">
                Help other families find us by leaving a quick review.
              </p>
            </div>
            <Button size="sm" onClick={() => onNavigate('reviews')} className="shrink-0">
              Write Review
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Announcements */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">Recent Announcements</h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('announcements')}>
            See all <ChevronRight className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
        {contentLoading ? (
          <V2SkeletonList rows={3} />
        ) : announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={[
                  'p-4 rounded-xl border',
                  ann.isPinned
                    ? 'border-l-4 border-l-amber-500 bg-amber-50/50 border-amber-200'
                    : 'bg-card border-border',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-foreground text-sm leading-snug">{ann.title}</p>
                  {ann.isPinned && (
                    <Badge variant="secondary" className="text-xs shrink-0 flex items-center gap-1">
                      <Pin className="w-3 h-3" /> Pinned
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{ann.body}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {ann.authorName} · {formatRelativeDate(ann.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Blog Posts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">Recent Blog Posts</h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('blog')}>
            See all <ChevronRight className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
        {contentLoading ? (
          <V2SkeletonList rows={2} />
        ) : blogPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No blog posts yet. Be the first to share!</p>
        ) : (
          <div className="space-y-3">
            {blogPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-3 p-4 rounded-xl border bg-card border-border hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => onNavigate('blog')}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {post.authorName} · {formatRelativeDate(post.createdAt)}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
