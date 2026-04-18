import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Skeleton } from '../ui/skeleton';
import { Edit2, User } from 'lucide-react';
import { toast } from 'sonner';
import { updateProfile, upsertAdminNotificationPreferences } from '../../lib/supabase/mutations';
import { getAdminNotificationPreferences } from '../../lib/supabase/queries';
import { supabase } from '../../lib/supabase/client';
import type { User as UserType } from '../../lib/types';

type AdminProfileTabProps = {
  user: NonNullable<UserType>;
  onClose: () => void;
  onRefreshUser: () => Promise<void>;
};

const defaultAdminPrefs = {
  notify_messages: true,
  notify_blog_posts: true,
  notify_comment_replies: true,
  notify_post_comments: true,
};

export function AdminProfileTab({ user, onClose, onRefreshUser }: AdminProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [adminPrefs, setAdminPrefs] = useState(defaultAdminPrefs);
  const [notifyNewLeads, setNotifyNewLeads] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminNotificationPreferences(),
      supabase
        .from('admin_notification_settings')
        .select('notify_new_leads')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle(),
    ])
      .then(([prefs, leadsSetting]) => {
        if (prefs) {
          setAdminPrefs({
            notify_messages: prefs.notify_messages,
            notify_blog_posts: prefs.notify_blog_posts,
            notify_comment_replies: prefs.notify_comment_replies,
            notify_post_comments: prefs.notify_post_comments,
          });
        }
        setNotifyNewLeads(leadsSetting.data?.notify_new_leads ?? false);
      })
      .catch(console.error)
      .finally(() => setPrefsLoading(false));
  }, [user.email]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateProfile(user.id, { display_name: displayName });
      await onRefreshUser();
      setIsEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  async function handleAdminPrefToggle(
    key: keyof typeof defaultAdminPrefs,
    value: boolean
  ) {
    const updated = { ...adminPrefs, [key]: value };
    setAdminPrefs(updated);
    try {
      await upsertAdminNotificationPreferences({ [key]: value });
      toast.success('Notification preferences saved');
    } catch {
      setAdminPrefs(adminPrefs);
      toast.error('Failed to save preferences');
    }
  }

  async function handleNewLeadsToggle(value: boolean) {
    setNotifyNewLeads(value);
    try {
      const { error } = await supabase
        .from('admin_notification_settings')
        .upsert(
          { email: user.email, notify_new_leads: value, is_active: true },
          { onConflict: 'email' }
        );
      if (error) throw error;
      toast.success('Notification preferences saved');
    } catch {
      setNotifyNewLeads(!value);
      toast.error('Failed to save preferences');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Admin Profile</h2>
          <p className="text-muted-foreground mt-1">
            Manage your admin account details
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          <CardDescription>Your admin account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <Input value={user.email} disabled className="disabled:opacity-50 cursor-not-allowed" />
              </div>
              {saveError && (
                <p className="text-sm text-destructive">{saveError}</p>
              )}
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => { setIsEditing(false); setSaveError(null); }} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="text-muted-foreground">Display Name</Label>
                <p>{displayName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p>{user.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <p className="capitalize">{user.role}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose when you'd like to receive emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {prefsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 py-1">
                <Label htmlFor="notify_new_leads" className="flex flex-col gap-0.5 cursor-pointer flex-1">
                  <span className="font-medium">New Enrollment Inquiries</span>
                  <span className="text-xs text-muted-foreground font-normal">Email me when a family submits a contact form</span>
                </Label>
                <Switch
                  id="notify_new_leads"
                  checked={notifyNewLeads}
                  onCheckedChange={handleNewLeadsToggle}
                />
              </div>
              {([
                { key: 'notify_messages' as const,        label: 'New Messages',           sub: 'Email me when I receive a message' },
                { key: 'notify_blog_posts' as const,      label: 'New Blog Posts',         sub: 'Email me when anyone publishes a blog post' },
                { key: 'notify_comment_replies' as const, label: 'Replies to My Comments', sub: 'Email me when someone replies to a comment I left' },
                { key: 'notify_post_comments' as const,   label: 'Comments on My Posts',   sub: 'Email me when someone comments on a post or announcement I wrote' },
              ] as const).map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between gap-4 py-1">
                  <Label htmlFor={key} className="flex flex-col gap-0.5 cursor-pointer flex-1">
                    <span className="font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground font-normal">{sub}</span>
                  </Label>
                  <Switch
                    id={key}
                    checked={adminPrefs[key]}
                    onCheckedChange={(checked) => handleAdminPrefToggle(key, checked)}
                  />
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
