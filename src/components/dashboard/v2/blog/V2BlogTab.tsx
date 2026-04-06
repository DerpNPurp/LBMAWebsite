import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Textarea } from '../../../ui/textarea';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Avatar, AvatarFallback } from '../../../ui/avatar';
import { MessageCircle, Send, Plus, Pin } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../../ui/sheet';
import { Badge } from '../../../ui/badge';
import { getBlogPosts, getBlogComments } from '../../../../lib/supabase/queries';
import { createBlogPost, createBlogComment } from '../../../../lib/supabase/mutations';
import { subscribeToBlogPosts, subscribeToBlogComments, unsubscribe } from '../../../../lib/supabase/realtime';
import { V2PageHeader } from '../shared/V2PageHeader';
import { V2SkeletonList } from '../shared/V2SkeletonList';
import { V2EmptyState } from '../shared/V2EmptyState';
import { BookOpen } from 'lucide-react';

type User = { id: string; email: string; role: 'admin' | 'family'; displayName: string };
type Comment = { id: string; authorName: string; body: string; createdAt: string };
type BlogPost = {
  id: string; title: string; body: string; authorName: string;
  createdAt: string; isPinned?: boolean;
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function V2BlogTab({ user }: { user: User }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<{ [id: string]: Comment[] }>({});
  const [commentTexts, setCommentTexts] = useState<{ [id: string]: string }>({});
  const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [savingComment, setSavingComment] = useState<string | null>(null);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [postingNew, setPostingNew] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getBlogPosts();
      const formatted: BlogPost[] = data.map((p: any) => ({
        id: p.post_id,
        title: p.title,
        body: p.body,
        authorName: p.profiles?.display_name || 'Parent',
        createdAt: p.created_at,
        isPinned: p.is_pinned || false,
      }));
      setPosts(formatted);

      const commentsMap: { [id: string]: Comment[] } = {};
      for (const post of formatted) {
        const cd = await getBlogComments(post.id);
        commentsMap[post.id] = cd.map((c: any) => ({
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
    const ch = subscribeToBlogPosts((payload) => {
      if (payload.eventType === 'INSERT') loadData();
    });
    return () => unsubscribe(ch);
  }, []);

  useEffect(() => {
    const channels: any[] = [];
    Object.keys(expanded).forEach((id) => {
      if (expanded[id]) {
        const ch = subscribeToBlogComments(id, () => {
          getBlogComments(id).then((cd) => {
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

  const handleSubmitComment = async (postId: string) => {
    const text = (commentTexts[postId] || '').trim();
    if (!text) return;
    setSavingComment(postId);
    try {
      await createBlogComment({ post_id: postId, author_user_id: user.id, body: text });
      setCommentTexts((prev) => ({ ...prev, [postId]: '' }));
      const cd = await getBlogComments(postId);
      setComments((prev) => ({
        ...prev,
        [postId]: cd.map((c: any) => ({
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

  const handleNewPost = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    setPostingNew(true);
    try {
      await createBlogPost({ author_user_id: user.id, title: newTitle.trim(), body: newBody.trim() });
      setNewTitle('');
      setNewBody('');
      setNewPostOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setPostingNew(false);
    }
  };

  return (
    <div className="space-y-6">
      <V2PageHeader
        title="Parent Blog"
        description="Connect with other LBMAA families — share tips, milestones, and stories."
        action={
          <Button onClick={() => setNewPostOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Post
          </Button>
        }
      />

      {loading ? (
        <V2SkeletonList rows={4} showAvatar />
      ) : posts.length === 0 ? (
        <V2EmptyState
          icon={BookOpen}
          heading="No posts yet"
          body="Be the first to share something with the LBMAA parent community!"
          action={{ label: 'Write a Post', onClick: () => setNewPostOpen(true) }}
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const postComments = comments[post.id] || [];
            const isOpen = expanded[post.id] ?? false;

            return (
              <Card key={post.id} className={post.isPinned ? 'border-l-4 border-l-amber-500' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {getInitials(post.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{post.authorName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>
                    {post.isPinned && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs flex items-center gap-1 shrink-0">
                        <Pin className="w-3 h-3" /> Pinned
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-2">{post.title}</h3>
                  <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>

                  <Collapsible
                    open={isOpen}
                    onOpenChange={(open) => setExpanded((prev) => ({ ...prev, [post.id]: open }))}
                    className="mt-4"
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
                        <MessageCircle className="w-4 h-4" />
                        {postComments.length} {postComments.length === 1 ? 'Comment' : 'Comments'}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                      {postComments.map((c) => (
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
                      <div className="flex gap-2 pt-1">
                        <Textarea
                          placeholder="Write a comment..."
                          value={commentTexts[post.id] || ''}
                          onChange={(e) => setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          className="text-sm resize-none min-h-[60px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmitComment(post.id);
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          className="shrink-0 h-10 w-10 self-end"
                          disabled={!commentTexts[post.id]?.trim() || savingComment === post.id}
                          onClick={() => handleSubmitComment(post.id)}
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

      {/* New Post Sheet */}
      <Sheet open={newPostOpen} onOpenChange={setNewPostOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8 max-w-2xl mx-auto">
          <SheetHeader className="mb-5">
            <SheetTitle>New Blog Post</SheetTitle>
            <SheetDescription>Share something with the LBMAA parent community.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="post-title" className="text-base font-medium">Title</Label>
              <Input
                id="post-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Tips for practicing at home"
                className="mt-1.5 h-11 text-base"
              />
            </div>
            <div>
              <Label htmlFor="post-body" className="text-base font-medium">Content</Label>
              <Textarea
                id="post-body"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Share your thoughts, tips, or experiences..."
                className="mt-1.5 text-base resize-none"
                rows={6}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setNewPostOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 h-11"
                disabled={!newTitle.trim() || !newBody.trim() || postingNew}
                onClick={handleNewPost}
              >
                {postingNew ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
