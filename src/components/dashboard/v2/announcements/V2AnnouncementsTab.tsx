import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Textarea } from '../../../ui/textarea';
import { Avatar, AvatarFallback } from '../../../ui/avatar';
import { Badge } from '../../../ui/badge';
import { MessageCircle, Send, Pin } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../ui/collapsible';
import { getAnnouncements, getAnnouncementComments } from '../../../../lib/supabase/queries';
import { createAnnouncementComment } from '../../../../lib/supabase/mutations';
import { subscribeToAnnouncements, subscribeToAnnouncementComments, unsubscribe } from '../../../../lib/supabase/realtime';
import { V2PageHeader } from '../shared/V2PageHeader';
import { V2SkeletonList } from '../shared/V2SkeletonList';
import { V2EmptyState } from '../shared/V2EmptyState';
import { Bell } from 'lucide-react';

type User = { id: string; email: string; role: 'admin' | 'family'; displayName: string };

type Comment = { id: string; authorName: string; body: string; createdAt: string };
type Announcement = {
  id: string; title: string; body: string; authorName: string;
  createdAt: string; imageUrl?: string; isPinned?: boolean;
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

export function V2AnnouncementsTab({ user }: { user: User }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [comments, setComments] = useState<{ [id: string]: Comment[] }>({});
  const [commentTexts, setCommentTexts] = useState<{ [id: string]: string }>({});
  const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [savingComment, setSavingComment] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements();
      const formatted: Announcement[] = data.map((a: any) => ({
        id: a.announcement_id,
        title: a.title,
        body: a.body,
        authorName: a.profiles?.display_name || 'Staff',
        createdAt: a.created_at,
        imageUrl: a.image_url || undefined,
        isPinned: a.is_pinned || false,
      }));
      setAnnouncements(formatted);

      const commentsMap: { [id: string]: Comment[] } = {};
      for (const ann of formatted) {
        const cd = await getAnnouncementComments(ann.id);
        commentsMap[ann.id] = cd.map((c: any) => ({
          id: c.comment_id,
          authorName: c.profiles?.display_name || 'Unknown',
          body: c.body,
          createdAt: c.created_at,
        }));
      }
      setComments(commentsMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const ch = subscribeToAnnouncements((payload) => {
      if (payload.eventType === 'INSERT') loadData();
    });
    return () => unsubscribe(ch);
  }, []);

  useEffect(() => {
    const channels: any[] = [];
    Object.keys(expanded).forEach((id) => {
      if (expanded[id]) {
        const ch = subscribeToAnnouncementComments(id, () => {
          getAnnouncementComments(id).then((cd) => {
            setComments((prev) => ({
              ...prev,
              [id]: cd.map((c: any) => ({
                id: c.comment_id,
                authorName: c.profiles?.display_name || 'Unknown',
                body: c.body,
                createdAt: c.created_at,
              })),
            }));
          });
        });
        channels.push(ch);
      }
    });
    return () => channels.forEach(unsubscribe);
  }, [expanded]);

  const handleSubmitComment = async (announcementId: string) => {
    const text = (commentTexts[announcementId] || '').trim();
    if (!text) return;
    setSavingComment(announcementId);
    try {
      await createAnnouncementComment({
        announcement_id: announcementId,
        author_user_id: user.id,
        body: text,
      });
      setCommentTexts((prev) => ({ ...prev, [announcementId]: '' }));
      const cd = await getAnnouncementComments(announcementId);
      setComments((prev) => ({
        ...prev,
        [announcementId]: cd.map((c: any) => ({
          id: c.comment_id,
          authorName: c.profiles?.display_name || 'Unknown',
          body: c.body,
          createdAt: c.created_at,
        })),
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setSavingComment(null);
    }
  };

  return (
    <div className="space-y-6">
      <V2PageHeader
        title="Announcements"
        description="Stay up to date with the latest school news and updates."
      />

      {loading ? (
        <V2SkeletonList rows={4} showAvatar />
      ) : announcements.length === 0 ? (
        <V2EmptyState
          icon={Bell}
          heading="No announcements yet"
          body="Check back soon — school updates will appear here."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const annComments = comments[ann.id] || [];
            const isOpen = expanded[ann.id] ?? false;

            return (
              <Card
                key={ann.id}
                className={ann.isPinned ? 'border-l-4 border-l-amber-500' : ''}
              >
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {getInitials(ann.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{ann.authorName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(ann.createdAt)}</p>
                      </div>
                    </div>
                    {ann.isPinned && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs flex items-center gap-1 shrink-0">
                        <Pin className="w-3 h-3" /> Pinned
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-foreground mb-2">{ann.title}</h3>
                  <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">{ann.body}</p>

                  {/* Image */}
                  {ann.imageUrl && (
                    <img
                      src={ann.imageUrl}
                      alt=""
                      className="mt-3 rounded-xl w-full object-cover max-h-64"
                      loading="lazy"
                    />
                  )}

                  {/* Comments collapsible */}
                  <Collapsible
                    open={isOpen}
                    onOpenChange={(open) => setExpanded((prev) => ({ ...prev, [ann.id]: open }))}
                    className="mt-4"
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
                        <MessageCircle className="w-4 h-4" />
                        {annComments.length} {annComments.length === 1 ? 'Comment' : 'Comments'}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                      {annComments.map((c) => (
                        <div key={c.id} className="flex gap-3">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="text-xs bg-muted">
                              {getInitials(c.authorName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-muted/60 rounded-xl px-3 py-2 flex-1">
                            <p className="text-xs font-semibold text-foreground">{c.authorName}</p>
                            <p className="text-sm text-foreground/80 mt-0.5">{c.body}</p>
                          </div>
                        </div>
                      ))}
                      {/* New comment */}
                      <div className="flex gap-2 pt-1">
                        <Textarea
                          placeholder="Add a comment..."
                          value={commentTexts[ann.id] || ''}
                          onChange={(e) =>
                            setCommentTexts((prev) => ({ ...prev, [ann.id]: e.target.value }))
                          }
                          className="text-sm resize-none min-h-[60px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmitComment(ann.id);
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          className="shrink-0 h-10 w-10 self-end"
                          disabled={!commentTexts[ann.id]?.trim() || savingComment === ann.id}
                          onClick={() => handleSubmitComment(ann.id)}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
