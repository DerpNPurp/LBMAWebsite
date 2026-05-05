import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, ShieldCheck, ShieldOff, UserX, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { ConfirmDialog } from '../ui/confirm-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getAdminProfiles, getAdminEmails } from '../../lib/supabase/queries';
import { deactivateAdmin, reactivateAdmin, setOwnerStatus } from '../../lib/supabase/mutations';
import { queryKeys } from '../../lib/queryKeys';
import { getInitials } from '../../lib/format';
import { supabase } from '../../lib/supabase/client';
import type { User } from '../../lib/types';

type AdminRow = {
  user_id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  is_owner: boolean;
  is_active: boolean;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AdminTeamTab({ user }: { user: NonNullable<User> }) {
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    destructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const { data: profiles = [] } = useQuery({
    queryKey: queryKeys.admins(),
    queryFn: getAdminProfiles,
  });

  const { data: adminEmails = [] } = useQuery({
    queryKey: queryKeys.adminEmails(),
    queryFn: getAdminEmails,
  });

  const admins: AdminRow[] = profiles.map((p) => {
    const emailRow = adminEmails.find((e) => e.user_id === p.user_id);
    return {
      user_id: p.user_id,
      display_name: p.display_name,
      email: emailRow?.email ?? '—',
      avatar_url: p.avatar_url,
      is_owner: p.is_owner,
      is_active: p.is_active,
    };
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.admins() });
    queryClient.invalidateQueries({ queryKey: queryKeys.adminEmails() });
  };

  const handleInvite = async () => {
    if (!isValidEmail(inviteEmail)) {
      toast.error('Enter a valid email address');
      return;
    }
    setIsInviting(true);
    try {
      const { error } = await supabase.functions.invoke('invite-admin', {
        body: { email: inviteEmail, name: inviteName.trim() || undefined },
      });
      if (error) throw error;
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteName('');
      setIsInviteOpen(false);
      invalidate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invite';
      toast.error(message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeactivate = (admin: AdminRow) => {
    setConfirmState({
      title: `Deactivate ${admin.display_name}?`,
      description: 'They will lose access to the admin portal immediately.',
      destructive: true,
      onConfirm: async () => {
        try {
          await deactivateAdmin(admin.user_id);
          toast.success(`${admin.display_name} deactivated`);
          invalidate();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to deactivate';
          toast.error(message);
        }
        setConfirmState(null);
      },
    });
  };

  const handleReactivate = async (admin: AdminRow) => {
    if (reactivatingId === admin.user_id) return;
    setReactivatingId(admin.user_id);
    try {
      await reactivateAdmin(admin.user_id);
      toast.success(`${admin.display_name} reactivated`);
      invalidate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reactivate';
      toast.error(message);
    } finally {
      setReactivatingId(null);
    }
  };

  const handleSetOwner = (admin: AdminRow, makeOwner: boolean) => {
    const action = makeOwner ? 'Grant owner status to' : 'Remove owner status from';
    const detail = makeOwner
      ? 'They will be able to manage admins and owners.'
      : 'They will remain an admin but lose owner controls.';
    setConfirmState({
      title: `${action} ${admin.display_name}?`,
      description: detail,
      onConfirm: async () => {
        try {
          await setOwnerStatus(admin.user_id, makeOwner);
          toast.success(makeOwner ? `${admin.display_name} is now an owner` : `Owner status removed`);
          invalidate();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to update owner status';
          toast.error(message);
        }
        setConfirmState(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold">Team</h2>
          <p className="text-muted-foreground mt-1">Manage admin accounts and ownership</p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Admins</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {admins.map((admin) => {
              const isYou = admin.user_id === user.id;
              return (
                <div
                  key={admin.user_id}
                  className={`flex items-center gap-3 px-6 py-4 ${isYou ? 'bg-accent/50' : ''} ${!admin.is_active ? 'opacity-60' : ''}`}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    {admin.avatar_url && <AvatarImage src={admin.avatar_url} alt={admin.display_name} />}
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                      {getInitials(admin.display_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{admin.display_name}</span>
                      {admin.is_owner && (
                        <Badge className="bg-[#EEF2FF] text-[#3730A3] border border-[rgba(55,48,163,0.2)] rounded-full text-xs">
                          Owner
                        </Badge>
                      )}
                      {isYou && (
                        <span className="text-xs text-muted-foreground italic">You</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{admin.email}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      className={`rounded-full text-xs ${
                        admin.is_active
                          ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]'
                          : 'bg-[#F1F0EF] text-[#6B6866] border border-[#E8E6E3]'
                      }`}
                    >
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </Badge>

                    {!isYou && admin.is_active && (
                      <>
                        {admin.is_owner ? (
                          <Button variant="outline" size="sm" onClick={() => handleSetOwner(admin, false)}>
                            <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
                            Remove Owner
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleSetOwner(admin, true)}>
                            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                            Make Owner
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/30 hover:bg-destructive/5"
                          onClick={() => handleDeactivate(admin)}
                        >
                          <UserX className="mr-1.5 h-3.5 w-3.5" />
                          Deactivate
                        </Button>
                      </>
                    )}

                    {!isYou && !admin.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReactivate(admin)}
                        disabled={reactivatingId === admin.user_id}
                      >
                        <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                        Reactivate
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {admins.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                No admins found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Invite a new admin</DialogTitle>
            <DialogDescription>
              They'll receive a magic link and skip family onboarding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Name</Label>
              <Input
                id="invite-name"
                placeholder="Full name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="admin@lbmaa.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isInviting}>
              {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmState && (
        <ConfirmDialog
          open={true}
          title={confirmState.title}
          description={confirmState.description}
          destructive={confirmState.destructive}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
