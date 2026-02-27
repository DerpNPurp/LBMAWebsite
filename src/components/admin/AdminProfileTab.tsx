import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Edit2, User } from 'lucide-react';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'family';
  displayName: string;
};

type AdminProfileTabProps = {
  user: User;
  onClose: () => void;
};

export function AdminProfileTab({ user, onClose }: AdminProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email);

  const handleSave = () => {
    // In production, this would save to Supabase
    alert('Profile updated!');
    setIsEditing(false);
  };

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
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save Changes</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
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
                <p>{email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <p className="capitalize">{user.role}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
