import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Plus, MessageCircle, Send, Pin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getBlogPosts, getBlogComments } from '../../lib/supabase/queries';
import { createBlogPost, createBlogComment, markSectionSeen } from '../../lib/supabase/mutations';
import { subscribeToBlogPosts, subscribeToBlogComments, unsubscribe } from '../../lib/supabase/realtime';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'family';
  displayName: string;
};

type Comment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  parentCommentId?: string | null;
};

type BlogPost = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  comments: Comment[];
  isPinned?: boolean;
};

export function BlogTab({ user }: { user: User }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [commentTexts, setCommentTexts] = useState<{ [key: string]: string }>({});
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingComment, setSavingComment] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{
    postId: string;
    commentId: string;
    authorName: string;
  } | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    markSectionSeen('blog').catch(console.error);
  }, []);

  // Load blog posts and comments
  const loadData = async () => {
    try {
      setLoading(true);
      const postsData = await getBlogPosts();
      
      // Convert to UI format
      const formattedPosts: BlogPost[] = postsData.map((p: any) => ({
        id: p.post_id,
        title: p.title,
        body: p.body,
        authorName: p.profiles?.display_name || 'Unknown',
        createdAt: p.created_at,
      }));

      setPosts(formattedPosts);

      // Load comments for each post
      const commentsMap: { [key: string]: Comment[] } = {};
      for (const post of formattedPosts) {
        const commentsData = await getBlogComments(post.id);
        commentsMap[post.id] = commentsData.map((c: any) => ({
          id: c.comment_id,
          authorName: c.profiles?.display_name || 'Unknown',
          body: c.body,
          createdAt: c.created_at,
          parentCommentId: c.parent_comment_id ?? null,
        }));
      }
      setComments(commentsMap);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      toast.error('Error loading blog posts: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Set up real-time subscriptions
    const postsChannel = subscribeToBlogPosts((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        loadData();
      }
    });

    return () => {
      unsubscribe(postsChannel);
    };
  }, []);

  // Set up comment subscriptions when comments are expanded
  useEffect(() => {
    const channels: any[] = [];
    
    Object.keys(expandedComments).forEach((postId) => {
      if (expandedComments[postId]) {
        const channel = subscribeToBlogComments(postId, (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            getBlogComments(postId).then((commentsData) => {
              setComments((prev) => ({
                ...prev,
                [postId]: commentsData.map((c: any) => ({
                  id: c.comment_id,
                  authorName: c.profiles?.display_name || 'Unknown',
                  body: c.body,
                  createdAt: c.created_at,
                  parentCommentId: c.parent_comment_id ?? null,
                })),
              }));
            });
          }
        });
        channels.push(channel);
      }
    });

    return () => {
      channels.forEach(channel => unsubscribe(channel));
    };
  }, [expandedComments]);

  // Sort posts: pinned first, then by date
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostBody.trim() || !user) return;

    setSaving(true);
    try {
      await createBlogPost({
        author_user_id: user.id,
        title: newPostTitle.trim(),
        body: newPostBody.trim(),
      });
      
      setNewPostTitle('');
      setNewPostBody('');
      setIsCreateDialogOpen(false);
      await loadData();
    } catch (error) {
      toast.error('Error creating post: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    const commentText = commentTexts[postId];
    if (!commentText?.trim() || !user) return;

    setSavingComment(postId);
    try {
      await createBlogComment(postId, commentText.trim());

      // Reload comments
      const commentsData = await getBlogComments(postId);
      setComments((prev) => ({
        ...prev,
        [postId]: commentsData.map((c: any) => ({
          id: c.comment_id,
          authorName: c.profiles?.display_name || 'Unknown',
          body: c.body,
          createdAt: c.created_at,
          parentCommentId: c.parent_comment_id ?? null,
        })),
      }));

      setCommentTexts({ ...commentTexts, [postId]: '' });
    } catch (error) {
      toast.error('Error adding comment: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSavingComment(null);
    }
  };

  async function handleSendReply(postId: string) {
    if (!replyText.trim() || !replyingTo) return;
    setSavingComment(replyingTo.commentId);
    try {
      await createBlogComment(postId, replyText.trim(), replyingTo.commentId);
      setReplyText('');
      setReplyingTo(null);
      await loadData();
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSavingComment(null);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const toggleComments = (postId: string) => {
    setExpandedComments({
      ...expandedComments,
      [postId]: !expandedComments[postId]
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Parent Blog</h2>
          <p className="text-muted-foreground mt-1">
            Share experiences and connect with other families
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create a Blog Post</DialogTitle>
              <DialogDescription>
                Share your thoughts, tips, or questions with the community
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Give your post a title..."
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="What would you like to share?"
                  value={newPostBody}
                  onChange={(e) => setNewPostBody(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={!newPostTitle.trim() || !newPostBody.trim() || saving}
              >
                Post
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {sortedPosts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No blog posts yet. Be the first to share!</p>
            </CardContent>
          </Card>
        ) : (
          sortedPosts.map((post) => {
            const postComments = comments[post.id] || [];
            return (
          <Card key={post.id}>
            <CardHeader className={post.isPinned ? 'bg-secondary/50 border-l-4 border-l-primary' : ''}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{post.authorName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{post.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <CardTitle>{post.title}</CardTitle>
                </div>
                {post.isPinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    <Pin className="w-3 h-3" />
                    Pinned
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground whitespace-pre-line">{post.body}</p>

              {/* Comments Section */}
              <div className="border-t pt-4 space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleComments(post.id)}
                  className="gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {postComments.length} {postComments.length === 1 ? 'Comment' : 'Comments'}
                </Button>

                {expandedComments[post.id] && (
                  <div className="space-y-4 pl-4 border-l-2 border-border">
                    {postComments.map((comment) => (
                      <div key={comment.id} className="space-y-1">
                        {comment.parentCommentId && (
                          <p className="text-xs text-muted-foreground pl-2 border-l-2 border-muted mb-1">
                            ↩ Replying to {
                              comments[post.id]?.find(c => c.id === comment.parentCommentId)?.authorName ?? 'comment'
                            }
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {comment.authorName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{comment.authorName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm pl-8">{comment.body}</p>
                        {!comment.parentCommentId && (
                          <button
                            onClick={() => setReplyingTo({
                              postId: post.id,
                              commentId: comment.id,
                              authorName: comment.authorName,
                            })}
                            className="text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
                          >
                            Reply
                          </button>
                        )}
                        {replyingTo?.commentId === comment.id && (
                          <div className="ml-8 mt-2 space-y-2">
                            <Textarea
                              autoFocus
                              placeholder={`Reply to ${replyingTo.authorName}…`}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="text-sm min-h-[60px] resize-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') { setReplyingTo(null); setReplyText(''); }
                              }}
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setReplyingTo(null); setReplyText(''); }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSendReply(post.id)}
                                disabled={!replyText.trim() || savingComment === comment.id}
                              >
                                {savingComment === comment.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Send className="h-3.5 w-3.5" />
                                )}
                                Send
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add Comment */}
                    <div className="flex gap-2 pt-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={commentTexts[post.id] || ''}
                        onChange={(e) =>
                          setCommentTexts({
                            ...commentTexts,
                            [post.id]: e.target.value
                          })
                        }
                        className="min-h-[80px]"
                      />
                      <Button
                        onClick={() => handleAddComment(post.id)}
                        disabled={!commentTexts[post.id]?.trim() || savingComment === post.id}
                        size="sm"
                      >
                        {savingComment === post.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
