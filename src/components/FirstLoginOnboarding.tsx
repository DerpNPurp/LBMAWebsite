import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { createFamily, createGuardian, updateProfile } from '../lib/supabase/mutations';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'family';
  displayName: string;
};

type FirstLoginOnboardingProps = {
  user: User;
  onComplete: () => void | Promise<void>;
  onLogout: () => Promise<void>;
};

export function FirstLoginOnboarding({ user, onComplete, onLogout }: FirstLoginOnboardingProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

    if (!trimmedFirst || !trimmedLast) {
      setError('Please enter the primary guardian first and last name to continue.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(user.id, { display_name: fullName });

      const family = await createFamily({
        owner_user_id: user.id,
        primary_email: user.email,
        address: null,
        city: null,
        state: null,
        zip: null,
      });

      await createGuardian({
        family_id: family.family_id,
        first_name: trimmedFirst,
        last_name: trimmedLast,
        email: user.email,
        phone_number: phoneNumber.trim() || null,
        relationship: 'Primary Guardian',
        is_primary_contact: true,
      });

      await onComplete();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Unable to complete onboarding right now.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <CardTitle>Complete Your First Login Setup</CardTitle>
          <CardDescription>
            Your invite is valid. Finish this quick setup before accessing portal features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="onboarding-email">Invited Email</Label>
              <Input id="onboarding-email" value={user.email} disabled />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">Primary Guardian First Name</Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  disabled={saving}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Primary Guardian Last Name</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  disabled={saving}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone-number">Primary Guardian Phone (optional)</Label>
              <Input
                id="phone-number"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                disabled={saving}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" className="sm:flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Complete Setup'}
              </Button>
              <Button type="button" variant="outline" className="sm:flex-1" onClick={() => void onLogout()} disabled={saving}>
                Sign Out
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
