import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Plus, Edit2, Trash2, Upload, Pin, PinOff, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { getAnnouncements } from '../../lib/supabase/queries';
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../lib/supabase/mutations';
import { subscribeToAnnouncements, unsubscribe } from '../../lib/supabase/realtime';

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
  imageUrl?: string;
  isPinned?: boolean;
};

const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Belt Testing Scheduled for March 15th',
    body: 'We are excited to announce that our next belt testing will take place on Saturday, March 15th at 10:00 AM. Students who have been recommended by their instructors will receive a formal invitation via email. Please ensure your child is prepared and arrives 15 minutes early. Good luck to all testing students!',
    authorName: 'Master Reyes',
    createdAt: '2026-02-01T10:00:00Z'
  },
  {
    id: '2',
    title: 'Facility Closed for Maintenance - Feb 10th',
    body: 'Our facility will be closed on Monday, February 10th for scheduled maintenance and deep cleaning. All classes are cancelled for that day. Regular schedule resumes Tuesday, February 11th. Thank you for your understanding!',
    authorName: 'Admin Team',
    createdAt: '2026-01-28T09:00:00Z'
  }
];

export function AdminAnnouncementsTab({ user }: { user: User }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements();
      const formatted: Announcement[] = data.map((a: any) => ({
        id: a.announcement_id,
        title: a.title,
        body: a.body,
        authorName: a.profiles?.display_name || 'Unknown',
        createdAt: a.created_at,
        isPinned: a.is_pinned || false,
      }));
      setAnnouncements(formatted);
    } catch (error) {
      console.error('Error loading announcements:', error);
      alert('Error loading announcements: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();

    const channel = subscribeToAnnouncements((payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
        loadAnnouncements();
      }
    });

    return () => unsubscribe(channel);
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newBody.trim() || !user) return;
    setSaving(true);
    try {
      await createAnnouncement({
        author_user_id: user.id,
        title: newTitle.trim(),
        body: newBody.trim(),
        is_pinned: false,
      });
      resetForm();
      setIsCreateDialogOpen(false);
      await loadAnnouncements();
      alert('Announcement created successfully!');
    } catch (error) {
      alert('Error creating announcement: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingAnnouncement || !newTitle.trim() || !newBody.trim()) return;
    setSaving(true);
    try {
      await updateAnnouncement(editingAnnouncement.id, {
        title: newTitle.trim(),
        body: newBody.trim(),
        is_pinned: editingAnnouncement.isPinned,
      });
      resetForm();
      setEditingAnnouncement(null);
      await loadAnnouncements();
      alert('Announcement updated successfully!');
    } catch (error) {
      alert('Error updating announcement: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      await loadAnnouncements();
      alert('Announcement deleted successfully!');
    } catch (error) {
      alert('Error deleting announcement: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleTogglePin = async (id: string) => {
    const announcement = announcements.find(a => a.id === id);
    if (!announcement) return;
    try {
      await updateAnnouncement(id, {
        is_pinned: !announcement.isPinned,
      });
      await loadAnnouncements();
    } catch (error) {
      alert('Error updating pin status: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Sort announcements: pinned first, then by date
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const resetForm = () => {
    setNewTitle('');
    setNewBody('');
    setSelectedImage('');
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setNewTitle(announcement.title);
    setNewBody(announcement.body);
    setSelectedImage(announcement.imageUrl || '');
  };

  const handleImageUpload = () => {
    // In production, this would open file picker and upload to Supabase storage
    alert('Image upload would be handled here. The file would be uploaded to Supabase storage and the URL saved.');
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Manage Announcements</h2>
          <p className="text-muted-foreground mt-1">
            Create and manage official school announcements
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
              <DialogDescription>
                Share important updates with all families
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Announcement title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  placeholder="Write your announcement..."
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Image (Optional)</Label>
                <Button 
                  variant="outline" 
                  onClick={handleImageUpload}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                {selectedImage && (
                  <p className="text-sm text-muted-foreground">Image selected</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!newTitle.trim() || !newBody.trim() || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Announcement'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAnnouncement} onOpenChange={(open) => !open && setEditingAnnouncement(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>
              Update announcement details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Announcement title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                placeholder="Write your announcement..."
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Image (Optional)</Label>
              <Button 
                variant="outline" 
                onClick={handleImageUpload}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingAnnouncement(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={!newTitle.trim() || !newBody.trim() || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcements List */}
      <div className="space-y-4">
        {sortedAnnouncements.map((announcement) => (
          <Card key={announcement.id}>
            <CardHeader className={announcement.isPinned ? 'bg-secondary/50 border-l-4 border-l-primary' : ''}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{announcement.authorName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{announcement.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(announcement.createdAt)}
                      </p>
                    </div>
                    {announcement.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        <Pin className="w-3 h-3" />
                        Pinned
                      </span>
                    )}
                  </div>
                  <CardTitle>{announcement.title}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePin(announcement.id)}
                    title={announcement.isPinned ? 'Unpin announcement' : 'Pin announcement'}
                  >
                    {announcement.isPinned ? (
                      <PinOff className="w-4 h-4" />
                    ) : (
                      <Pin className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(announcement)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(announcement.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-line">{announcement.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
