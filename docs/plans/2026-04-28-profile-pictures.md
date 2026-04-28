# Profile Pictures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow family accounts to upload, replace, and remove a profile photo for their account and each student; photos appear in the Profile tab, Messages, and Admin views.

**Architecture:** A new public Supabase Storage bucket (`profile-pictures`) stores images at stable paths; `avatar_url` and `photo_url` columns on `profiles` and `students` cache public URLs. The `User` type gains `avatarUrl` so every component that already receives `user` gets the avatar without prop-drilling changes.

**Tech Stack:** React + TypeScript, Supabase (Storage + PostgREST), shadcn/ui Avatar, Vite

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/migrations/028_profile_pictures.sql` | Create | DB columns + bucket + storage RLS |
| `src/lib/types.ts` | Modify | Add `avatar_url` to `Profile`, `photo_url` to `Student`, `avatarUrl` to `User` |
| `src/lib/supabase/selects.ts` | Modify | Add new columns to `PROFILE_COLUMNS` and `STUDENT_COLUMNS` |
| `src/lib/supabase/storage.ts` | Modify | Add `uploadProfileImage`, `deleteProfileImage`, `getProfilePublicUrl` helpers |
| `src/lib/supabase/mutations.ts` | Modify | Add `updateProfileAvatar`, `updateStudentPhoto` |
| `src/lib/supabase/queries.ts` | Modify | Add `avatar_url` to `MessageWithMeta` + `getMessages` join |
| `src/hooks/useAuth.ts` | Modify | Populate `avatarUrl` on the `User` object |
| `src/components/dashboard/messages/helpers.ts` | Modify | Add `avatar_url` to `MessageRecord`, `authorAvatarUrl` to `MessageListItem` |
| `src/components/dashboard/PhotoUploader.tsx` | Create | Reusable avatar upload/remove widget |
| `src/components/dashboard/ProfileTab.tsx` | Modify | Account photo card + student photo overlays |
| `src/components/DashboardV2.tsx` | Modify | Sidebar footer avatar shows photo |
| `src/components/dashboard/MessagesTab.tsx` | Modify | Conversation list + thread avatars |
| `src/hooks/useAdminFamilies.ts` | Modify | Add `ownerUserId`+`avatarUrl` to `Family`, `photoUrl` to `StudentRow` |
| `src/components/admin/AdminUsersTab.tsx` | Modify | Show family/student avatars (read-only) |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/028_profile_pictures.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/028_profile_pictures.sql

-- 1. Add avatar columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE students  ADD COLUMN IF NOT EXISTS photo_url  TEXT;

-- 2. Create public storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS — account avatar (family uploads their own)
DROP POLICY IF EXISTS "families upload own avatar"   ON storage.objects;
DROP POLICY IF EXISTS "families update own avatar"   ON storage.objects;
DROP POLICY IF EXISTS "families delete own avatar"   ON storage.objects;

CREATE POLICY "families upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND name = 'profiles/' || auth.uid()::text || '/avatar'
);

CREATE POLICY "families update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND name = 'profiles/' || auth.uid()::text || '/avatar'
);

CREATE POLICY "families delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND name = 'profiles/' || auth.uid()::text || '/avatar'
);

-- 4. Storage RLS — student photos (family uploads for their own students)
DROP POLICY IF EXISTS "families upload student photo"  ON storage.objects;
DROP POLICY IF EXISTS "families update student photo"  ON storage.objects;
DROP POLICY IF EXISTS "families delete student photo"  ON storage.objects;

CREATE POLICY "families upload student photo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND EXISTS (
    SELECT 1 FROM students s
    JOIN families f ON s.family_id = f.family_id
    WHERE 'students/' || s.student_id::text || '/photo' = name
      AND f.owner_user_id = auth.uid()
  )
);

CREATE POLICY "families update student photo"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND EXISTS (
    SELECT 1 FROM students s
    JOIN families f ON s.family_id = f.family_id
    WHERE 'students/' || s.student_id::text || '/photo' = name
      AND f.owner_user_id = auth.uid()
  )
);

CREATE POLICY "families delete student photo"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND EXISTS (
    SELECT 1 FROM students s
    JOIN families f ON s.family_id = f.family_id
    WHERE 'students/' || s.student_id::text || '/photo' = name
      AND f.owner_user_id = auth.uid()
  )
);
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `mcp__plugin_supabase_supabase__apply_migration` tool with the SQL above.

- [ ] **Step 3: Verify columns exist**

Run via MCP (`mcp__plugin_supabase_supabase__execute_sql`):
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name IN ('profiles', 'students')
  AND column_name IN ('avatar_url', 'photo_url');
```
Expected: 2 rows returned.

- [ ] **Step 4: Verify bucket exists**

```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'profile-pictures';
```
Expected: 1 row with `public = true`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/028_profile_pictures.sql
git commit -m "feat: add profile pictures migration — columns + storage bucket + RLS"
```

---

## Task 2: TypeScript Types & Select Columns

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/supabase/selects.ts`

- [ ] **Step 1: Update `Profile` type in `src/lib/types.ts`**

Find the `Profile` type (lines 25–33) and add `avatar_url`:

```ts
export type Profile = {
  user_id: string;
  role: UserRole;
  display_name: string;
  is_active: boolean;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
};
```

- [ ] **Step 2: Update `Student` type in `src/lib/types.ts`**

Find the `Student` type (lines 62–73) and add `photo_url`:

```ts
export type Student = {
  student_id: string;
  family_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  belt_level: BeltLevel | null;
  status: 'active' | 'inactive';
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};
```

- [ ] **Step 3: Update `User` type in `src/lib/types.ts`**

Find the `User` type (lines 18–23) and add `avatarUrl`:

```ts
export type User = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  avatarUrl: string | null;
} | null;
```

- [ ] **Step 4: Update `PROFILE_COLUMNS` in `src/lib/supabase/selects.ts`**

```ts
export const PROFILE_COLUMNS = 'user_id, role, display_name, is_active, deactivated_at, created_at, updated_at, avatar_url';
```

- [ ] **Step 5: Update `STUDENT_COLUMNS` in `src/lib/supabase/selects.ts`**

```ts
export const STUDENT_COLUMNS =
  'student_id, family_id, first_name, last_name, date_of_birth, belt_level, status, notes, photo_url, created_at, updated_at';
```

- [ ] **Step 6: Type-check**

```bash
npm run lint
```
Expected: No new type errors. (There will be errors about `avatarUrl` being missing where `User` is constructed — those are fixed in Task 3.)

- [ ] **Step 7: Commit**

```bash
git add src/lib/types.ts src/lib/supabase/selects.ts
git commit -m "feat: add avatar_url/photo_url to Profile+Student types and select columns"
```

---

## Task 3: Storage Helpers + useAuth Fix

**Files:**
- Modify: `src/lib/supabase/storage.ts`
- Modify: `src/hooks/useAuth.ts`

- [ ] **Step 1: Add constants and helpers to `src/lib/supabase/storage.ts`**

Append to the end of the file:

```ts
// ============================================
// PROFILE PICTURES
// ============================================

const PROFILE_PICTURES_BUCKET = 'profile-pictures';

export const MAX_PROFILE_IMAGE_SIZE_MB = 5;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function getProfilePublicUrl(path: string): string {
  const { data } = supabase.storage.from(PROFILE_PICTURES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProfileImage(path: string, file: File): Promise<string> {
  const { error } = await supabase.storage
    .from(PROFILE_PICTURES_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true });
  if (error) throw error;
  return getProfilePublicUrl(path);
}

export async function deleteProfileImage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(PROFILE_PICTURES_BUCKET)
    .remove([path]);
  if (error) throw error;
}
```

- [ ] **Step 2: Fix `useAuth.ts` — populate `avatarUrl` on the User object**

In `src/hooks/useAuth.ts`, find the `nextUser` construction (around line 159) and add `avatarUrl`:

```ts
const nextUser = {
  id: supabaseUser.id,
  email: supabaseUser.email || '',
  role,
  displayName: resolvedProfile.display_name,
  avatarUrl: resolvedProfile.avatar_url ?? null,
};
```

- [ ] **Step 3: Type-check**

```bash
npm run lint
```
Expected: No errors (the `avatarUrl` field is now present wherever `User` objects are constructed).

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/storage.ts src/hooks/useAuth.ts
git commit -m "feat: add profile image storage helpers and avatarUrl to auth user"
```

---

## Task 4: DB Mutations for Avatar/Photo

**Files:**
- Modify: `src/lib/supabase/mutations.ts`

- [ ] **Step 1: Add `updateProfileAvatar` and `updateStudentPhoto` to `mutations.ts`**

After the existing `updateProfile` function, add:

```ts
export async function updateProfileAvatar(userId: string, avatarUrl: string | null): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('user_id', userId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}
```

After the existing `updateStudent` function, add:

```ts
export async function updateStudentPhoto(studentId: string, photoUrl: string | null): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .update({ photo_url: photoUrl })
    .eq('student_id', studentId)
    .select(STUDENT_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}
```

- [ ] **Step 2: Type-check**

```bash
npm run lint
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/mutations.ts
git commit -m "feat: add updateProfileAvatar and updateStudentPhoto mutations"
```

---

## Task 5: PhotoUploader Component

**Files:**
- Create: `src/components/dashboard/PhotoUploader.tsx`

- [ ] **Step 1: Create `src/components/dashboard/PhotoUploader.tsx`**

```tsx
import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../ui/confirm-dialog';
import { toast } from 'sonner';
import { ACCEPTED_IMAGE_TYPES, MAX_PROFILE_IMAGE_SIZE_MB } from '../../lib/supabase/storage';

type PhotoUploaderProps = {
  currentUrl: string | null;
  fallback: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
};

const sizeClasses: Record<NonNullable<PhotoUploaderProps['size']>, string> = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
};

export function PhotoUploader({
  currentUrl,
  fallback,
  onUpload,
  onRemove,
  size = 'lg',
  disabled,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, WebP, or GIF image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_PROFILE_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_PROFILE_IMAGE_SIZE_MB} MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveConfirmed = async () => {
    setConfirmRemove(false);
    setRemoving(true);
    try {
      await onRemove();
    } finally {
      setRemoving(false);
    }
  };

  const busy = uploading || removing;

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <Avatar className={sizeClasses[size]}>
          {currentUrl && <AvatarImage src={currentUrl} alt="Profile photo" />}
          <AvatarFallback className="text-lg">{fallback}</AvatarFallback>
        </Avatar>
        {!disabled && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
            aria-label="Change photo"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleFileChange}
        disabled={disabled}
      />

      <div className="flex flex-col gap-1">
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Photo'
            )}
          </Button>
        )}
        {currentUrl && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmRemove(true)}
            disabled={busy}
            className="text-destructive hover:text-destructive"
          >
            {removing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Photo
              </>
            )}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        title="Remove photo"
        description="Remove your photo? You'll revert to the initials avatar."
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemoveConfirmed}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run lint
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/PhotoUploader.tsx
git commit -m "feat: add PhotoUploader reusable component"
```

---

## Task 6: Account Photo in Profile Tab + Sidebar

**Files:**
- Modify: `src/components/dashboard/ProfileTab.tsx`
- Modify: `src/components/DashboardV2.tsx`

- [ ] **Step 1: Add imports to `ProfileTab.tsx`**

At the top of `src/components/dashboard/ProfileTab.tsx`, add these imports (alongside the existing ones):

```tsx
import { PhotoUploader } from './PhotoUploader';
import { uploadProfileImage, deleteProfileImage } from '../../lib/supabase/storage';
import { updateProfileAvatar } from '../../lib/supabase/mutations';
```

Also add `AvatarImage` to the existing avatar import:
```tsx
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
```

- [ ] **Step 2: Add the "Profile Photo" card to `ProfileTab.tsx`**

In `ProfileTab.tsx`, find the opening of the return JSX (the `<div className="space-y-6">` around line 468). After the `<div>` heading block (the `<h2>` / description), and **before** the `{/* Family Information */}` Card, insert a new card:

```tsx
{/* Profile Photo */}
<Card>
  <CardHeader>
    <div className="flex items-center gap-2">
      <UserIcon className="w-5 h-5" />
      <CardTitle>Profile Photo</CardTitle>
    </div>
    <CardDescription>
      This photo appears on your account and in messages
    </CardDescription>
  </CardHeader>
  <CardContent>
    <PhotoUploader
      currentUrl={user.avatarUrl}
      fallback={user.displayName?.[0] ?? '?'}
      onUpload={async (file) => {
        const path = `profiles/${user.id}/avatar`;
        const url = await uploadProfileImage(path, file);
        await updateProfileAvatar(user.id, url);
        await onRefreshUser();
        toast.success('Profile photo updated');
      }}
      onRemove={async () => {
        const path = `profiles/${user.id}/avatar`;
        await deleteProfileImage(path);
        await updateProfileAvatar(user.id, null);
        await onRefreshUser();
        toast.success('Profile photo removed');
      }}
    />
  </CardContent>
</Card>
```

- [ ] **Step 3: Update sidebar avatar in `DashboardV2.tsx`**

In `src/components/DashboardV2.tsx`, find the expanded sidebar footer avatar (around line 158):

```tsx
<Avatar className="h-8 w-8 shrink-0">
  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
    {getInitials(user.displayName)}
  </AvatarFallback>
</Avatar>
```

Replace with:

```tsx
<Avatar className="h-8 w-8 shrink-0">
  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
    {getInitials(user.displayName)}
  </AvatarFallback>
</Avatar>
```

Also add `AvatarImage` to the existing avatar import at the top of `DashboardV2.tsx`:
```tsx
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
```

Find the collapsed sidebar avatar (look for the second `Avatar` for the icon-only state, around line 199) and apply the same change.

- [ ] **Step 4: Type-check**

```bash
npm run lint
```
Expected: No errors.

- [ ] **Step 5: Manual verification**

Run `npm run dev`. Log in as a family user. Navigate to Profile tab. Confirm:
- "Profile Photo" card appears at top
- "Upload Photo" button opens a file picker
- Upload a JPEG — photo appears in avatar immediately and in the sidebar
- Refresh page — photo persists
- Click "Remove Photo" → confirm dialog → photo reverts to initials

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/ProfileTab.tsx src/components/DashboardV2.tsx
git commit -m "feat: add account profile photo upload to ProfileTab and sidebar"
```

---

## Task 7: Student Photos in Profile Tab

**Files:**
- Modify: `src/components/dashboard/ProfileTab.tsx`

- [ ] **Step 1: Add `photoUrl` to the local `Student` UI type**

In `ProfileTab.tsx`, find the local `Student` type (around line 32):

```ts
type Student = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  beltLevel: string;
  status: 'active' | 'inactive';
  notes: string;
  photoUrl: string | null;
};
```

- [ ] **Step 2: Map `photo_url` when converting DB students to UI students**

Find the `students` mapping (around line 171):

```tsx
const students: Student[] = dbStudents.map(s => ({
  id: s.student_id,
  firstName: s.first_name,
  lastName: s.last_name,
  dateOfBirth: s.date_of_birth || '',
  beltLevel: s.belt_level || 'White Belt',
  status: s.status,
  notes: s.notes || '',
  photoUrl: s.photo_url ?? null,
}));
```

- [ ] **Step 3: Add student photo handlers to `ProfileTab.tsx`**

After the `handleSaveGuardian` function, add:

```tsx
const handleUploadStudentPhoto = async (studentId: string, file: File) => {
  const path = `students/${studentId}/photo`;
  const url = await uploadProfileImage(path, file);
  await updateStudent(studentId, { photo_url: url });
  toast.success('Photo updated');
};

const handleRemoveStudentPhoto = async (studentId: string) => {
  const path = `students/${studentId}/photo`;
  await deleteProfileImage(path);
  await updateStudent(studentId, { photo_url: null });
  toast.success('Photo removed');
};
```

Note: `updateStudent` here refers to the `updateStudent` returned from `useProfile` (destructured as `updateStudent: updateStudentData`). Make sure to use the hook's `updateStudent` function (not the raw mutation) so local state updates automatically.

- [ ] **Step 4: Replace student card `Avatar` with `PhotoUploader` in `ProfileTab.tsx`**

Find the student card avatar block (around line 745):

```tsx
<Avatar className="h-16 w-16">
  <AvatarFallback className="text-lg">
    {student.firstName[0]}{student.lastName[0]}
  </AvatarFallback>
</Avatar>
```

Replace with:

```tsx
<PhotoUploader
  currentUrl={student.photoUrl}
  fallback={`${student.firstName[0]}${student.lastName[0]}`}
  size="md"
  onUpload={(file) => handleUploadStudentPhoto(student.id, file)}
  onRemove={() => handleRemoveStudentPhoto(student.id)}
/>
```

- [ ] **Step 5: Add photo section to Edit Student dialog**

In the Edit Student dialog (around line 800), after the Notes field and before the dialog action buttons, add:

```tsx
<div className="space-y-2">
  <Label>Student Photo</Label>
  <PhotoUploader
    currentUrl={students.find(s => s.id === editingStudent?.id)?.photoUrl ?? null}
    fallback={`${editingStudent?.firstName[0] ?? ''}${editingStudent?.lastName[0] ?? ''}`}
    size="sm"
    onUpload={(file) => handleUploadStudentPhoto(editingStudent!.id, file)}
    onRemove={() => handleRemoveStudentPhoto(editingStudent!.id)}
  />
</div>
```

- [ ] **Step 6: Type-check**

```bash
npm run lint
```
Expected: No errors.

- [ ] **Step 7: Manual verification**

In the browser:
- Navigate to Profile → Students
- Hover over a student card avatar — camera icon overlay appears
- Click it, upload a photo — photo appears in the avatar
- Open Edit Student dialog — photo section shows current photo with upload/remove options
- Remove photo — reverts to initials

- [ ] **Step 8: Commit**

```bash
git add src/components/dashboard/ProfileTab.tsx
git commit -m "feat: add student photo upload to ProfileTab student cards"
```

---

## Task 8: Avatars in Messages Tab

**Files:**
- Modify: `src/lib/supabase/queries.ts`
- Modify: `src/components/dashboard/messages/helpers.ts`
- Modify: `src/components/dashboard/MessagesTab.tsx`

- [ ] **Step 1: Add `avatar_url` to `MessageWithMeta` in `queries.ts`**

Find `MessageWithMeta` (around line 380):

```ts
export type MessageWithMeta = Message & {
  profiles: { display_name: string | null; role: string | null; avatar_url: string | null } | null;
  message_attachments: MessageAttachment[];
};
```

- [ ] **Step 2: Add `avatar_url` to the `getMessages` query join in `queries.ts`**

Find `getMessages` (around line 385). Update the profiles join:

```ts
export async function getMessages(conversationId: string): Promise<MessageWithMeta[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      ${MESSAGE_COLUMNS},
      profiles!messages_author_user_id_fkey (
        display_name,
        role,
        avatar_url
      ),
      message_attachments (${MESSAGE_ATTACHMENT_COLUMNS})
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as MessageWithMeta[];
}
```

- [ ] **Step 3: Add `avatar_url` to `MessageRecord` and `authorAvatarUrl` to `MessageListItem` in `helpers.ts`**

```ts
export type MessageRecord = {
  message_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
  profiles?: { display_name?: string | null; avatar_url?: string | null } | null;
  message_attachments?: Array<{
    file_name?: string | null;
    storage_path?: string | null;
  }> | null;
};

export type MessageListItem = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string;
  attachmentName?: string;
  attachmentPath?: string;
};
```

Update `formatMessages`:

```ts
export function formatMessages(messagesData: MessageRecord[]): MessageListItem[] {
  return messagesData.map((message) => ({
    id: message.message_id,
    authorId: message.author_user_id,
    authorName: message.profiles?.display_name || 'Unknown',
    authorAvatarUrl: message.profiles?.avatar_url ?? null,
    body: message.body,
    createdAt: message.created_at,
    attachmentName: message.message_attachments?.[0]?.file_name || undefined,
    attachmentPath: message.message_attachments?.[0]?.storage_path || undefined,
  }));
}
```

- [ ] **Step 4: Add `avatarUrl` to the local `Conversation` type in `MessagesTab.tsx`**

Find the local `Conversation` type (around line 45):

```ts
type Conversation = {
  id: string;
  name: string;
  type: 'direct' | 'group';
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  avatarUrl?: string | null;
};
```

- [ ] **Step 5: Populate `avatarUrl` when formatting DM conversations in `MessagesTab.tsx`**

Find the DM conversation formatting block (around line 259, where `formattedConvs.push` for DMs happens):

```ts
formattedConvs.push({
  id: conv.conversation_id,
  name: otherProfile?.display_name || 'Unknown',
  type: 'direct',
  unreadCount,
  lastMessage: lastMsg?.body?.substring(0, 50),
  lastMessageTime: lastMsg?.created_at,
  avatarUrl: otherProfile?.avatar_url ?? null,
});
```

Also in `handleCreateDirectConversation` (around line 165), update the `upsertConversation` call:

```ts
upsertConversation({
  id: directConversation.conversation_id,
  name: target.displayName,
  type: 'direct',
  unreadCount: calculateUnreadCount(directMessages, user.id, selfMembership?.last_read_at),
  lastMessage: lastMessage?.body?.substring(0, 50),
  lastMessageTime: lastMessage?.created_at,
  avatarUrl: profiles.find(p => p.user_id === target.userId)?.avatar_url ?? null,
});
```

Note: `profiles` is in scope from the outer `loadConversations` effect. For `handleCreateDirectConversation`, store profiles in a ref or state so it's accessible. Add a `profilesRef = useRef<Profile[]>([])` and set it when profiles are loaded.

Specifically, at the top of the component add:
```tsx
const profilesRef = useRef<Profile[]>([]);
```

And in `loadConversations` after `const profiles = await getAllProfiles();`:
```tsx
profilesRef.current = profiles;
```

Then in `handleCreateDirectConversation`:
```tsx
avatarUrl: profilesRef.current.find(p => p.user_id === target.userId)?.avatar_url ?? null,
```

Also add `Profile` to the import from `../../lib/types`.

- [ ] **Step 6: Add `AvatarImage` to conversation list in `MessagesTab.tsx`**

Find the conversation list avatar (around line 507). Add `AvatarImage` import to the avatar import:
```tsx
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
```

Update the conversation list avatar:

```tsx
<Avatar className="h-10 w-10 flex-shrink-0">
  {conversation.avatarUrl && conversation.type === 'direct' && (
    <AvatarImage src={conversation.avatarUrl} alt={conversation.name} />
  )}
  <AvatarFallback>
    {conversation.type === 'group' ? (
      <UsersIcon className="w-5 h-5" />
    ) : (
      conversation.name[0]
    )}
  </AvatarFallback>
</Avatar>
```

Also update the message header avatar (around line 554):

```tsx
<Avatar className="h-10 w-10">
  {selectedConversation?.avatarUrl && selectedConversation.type === 'direct' && (
    <AvatarImage src={selectedConversation.avatarUrl} alt={selectedConversation.name} />
  )}
  <AvatarFallback>
    {selectedConversation?.type === 'group' ? (
      <UsersIcon className="w-5 h-5" />
    ) : (
      selectedConversation?.name[0] || '?'
    )}
  </AvatarFallback>
</Avatar>
```

- [ ] **Step 7: Add per-message avatars to message thread in `MessagesTab.tsx`**

Find the message rendering block (around line 583). Update it to show avatars for other people's messages:

```tsx
currentMessages.map((message) => {
  const isOwnMessage = message.authorId === user.id;

  return (
    <div
      key={message.id}
      className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
    >
      {!isOwnMessage && (
        <Avatar className="h-7 w-7 flex-shrink-0">
          {message.authorAvatarUrl && (
            <AvatarImage src={message.authorAvatarUrl} alt={message.authorName} />
          )}
          <AvatarFallback className="text-xs">
            {message.authorName[0]}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[70%] ${
          isOwnMessage
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary'
        } rounded-lg p-3`}
      >
        {!isOwnMessage && (
          <p className="text-xs font-medium mb-1 opacity-70">
            {message.authorName}
          </p>
        )}
        <p className="text-sm">{message.body}</p>
        {message.attachmentName && (
          <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
            <Paperclip className="w-3 h-3" />
            <button
              type="button"
              className="underline text-left disabled:no-underline disabled:opacity-70"
              onClick={() => handleOpenAttachment(message)}
              disabled={openingAttachmentId === message.id}
            >
              {openingAttachmentId === message.id ? 'Opening...' : message.attachmentName}
            </button>
          </div>
        )}
        <p className="text-xs opacity-70 mt-1">
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
})
```

- [ ] **Step 8: Type-check**

```bash
npm run lint
```
Expected: No errors.

- [ ] **Step 9: Manual verification**

In the browser:
- Open Messages tab
- DM conversation list shows the other person's avatar (if they have one set)
- Message thread shows avatars for messages from others
- Group chat conversation shows the group icon (no individual avatar)

- [ ] **Step 10: Commit**

```bash
git add src/lib/supabase/queries.ts src/components/dashboard/messages/helpers.ts src/components/dashboard/MessagesTab.tsx
git commit -m "feat: show profile photo avatars in messages conversation list and thread"
```

---

## Task 9: Admin View — Read-Only Avatars

**Files:**
- Modify: `src/hooks/useAdminFamilies.ts`
- Modify: `src/components/admin/AdminUsersTab.tsx`

- [ ] **Step 1: Add `ownerUserId` and `avatarUrl` to `Family` type in `useAdminFamilies.ts`**

Find the `Family` type (around line 37):

```ts
export type Family = {
  id: string;
  ownerUserId: string;
  primaryEmail: string;
  primaryContact: string;
  phoneNumber: string | null;
  address: string;
  studentCount: number;
  status: FamilyStatus;
  joinedDate: string;
  students: StudentRow[];
  guardians: GuardianRow[];
};
```

- [ ] **Step 2: Add `photoUrl` to `StudentRow` in `useAdminFamilies.ts`**

Find the `StudentRow` type (around line 22):

```ts
export type StudentRow = {
  studentId: string;
  studentName: string;
  firstName: string;
  lastName: string;
  age: number;
  beltLevel: string;
  status: StudentStatus;
  notes: string;
  photoUrl: string | null;
  familyId: string;
  familyName: string;
  primaryContact: string;
  primaryEmail: string;
};
```

- [ ] **Step 3: Update `mapFamilyRecord` in `useAdminFamilies.ts` to map the new fields**

In `mapFamilyRecord`, update the students map to include `photoUrl`:

```ts
const students: StudentRow[] = (details.students || []).map((student: Student) => ({
  studentId: student.student_id,
  studentName: `${student.first_name} ${student.last_name}`,
  firstName: student.first_name,
  lastName: student.last_name,
  age: calculateAge(student.date_of_birth),
  beltLevel: student.belt_level ?? 'White Belt',
  status: student.status === 'inactive' ? 'inactive' : 'active',
  notes: student.notes ?? '',
  photoUrl: student.photo_url ?? null,
  familyId: details.family_id,
  familyName: `${primaryGuardian?.name ?? 'Unknown'} Family`,
  primaryContact: primaryGuardian?.name ?? 'Unknown',
  primaryEmail: details.primary_email,
}));
```

Update the return value of `mapFamilyRecord` to include `ownerUserId`:

```ts
return {
  id: details.family_id,
  ownerUserId: details.owner_user_id,
  primaryEmail: details.primary_email,
  primaryContact: primaryGuardian?.name ?? 'Unknown',
  phoneNumber: primaryGuardian?.phone ?? null,
  address: [details.address, details.city, details.state, details.zip].filter(Boolean).join(', ') || 'Not set',
  studentCount: students.length,
  status: toFamilyStatus(details.account_status),
  joinedDate: details.created_at,
  students,
  guardians,
};
```

Note: The `Family` DB type (from `src/lib/types.ts`) already has `owner_user_id` in the spread via `FamilyWithRelations extends Family`. Verify that `FAMILY_COLUMNS` includes `owner_user_id` — if not, add it.

Check `src/lib/supabase/selects.ts`:
```
FAMILY_COLUMNS = 'family_id, owner_user_id, primary_email, ...'
```
It does already include `owner_user_id`, so `details.owner_user_id` is available.

- [ ] **Step 4: Add profile avatars map to `AdminUsersTab.tsx`**

In `AdminUsersTab.tsx`, add state and a load effect for the profile avatar map. Add at the top of the component (after existing state declarations):

```tsx
import { getAllProfiles } from '../../lib/supabase/queries';
import { AvatarImage } from '../ui/avatar'; // add to existing avatar import
```

Add state:
```tsx
const [profileAvatarMap, setProfileAvatarMap] = useState<Map<string, string | null>>(new Map());
```

Add effect (after the existing state declarations):
```tsx
useEffect(() => {
  getAllProfiles()
    .then((profiles) => {
      setProfileAvatarMap(new Map(profiles.map((p) => [p.user_id, p.avatar_url ?? null])));
    })
    .catch(console.error);
}, []);
```

- [ ] **Step 5: Show family avatar in the families list table in `AdminUsersTab.tsx`**

Find the family table rows where `Avatar` is rendered for families (search for `AvatarFallback` near family names). Update to include `AvatarImage`:

```tsx
<Avatar className="h-8 w-8">
  {profileAvatarMap.get(family.ownerUserId) && (
    <AvatarImage
      src={profileAvatarMap.get(family.ownerUserId)!}
      alt={family.primaryContact}
    />
  )}
  <AvatarFallback className="text-xs">
    {family.primaryContact.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
  </AvatarFallback>
</Avatar>
```

- [ ] **Step 6: Show student photo in the family detail view in `AdminUsersTab.tsx`**

Find where students are rendered in the detail view (search for student cards in `AdminUsersTab`). Update the student avatar to include `AvatarImage`:

```tsx
<Avatar className="h-10 w-10">
  {student.photoUrl && (
    <AvatarImage src={student.photoUrl} alt={student.studentName} />
  )}
  <AvatarFallback className="text-xs">
    {student.firstName[0]}{student.lastName[0]}
  </AvatarFallback>
</Avatar>
```

- [ ] **Step 7: Type-check**

```bash
npm run lint
```
Expected: No errors.

- [ ] **Step 8: Manual verification**

Log in as admin. Open Users tab:
- Family rows show the family's profile photo (if set)
- Click "View Details" on a family — student cards show student photos (if set)
- No upload buttons visible for admin (read-only)

- [ ] **Step 9: Commit**

```bash
git add src/hooks/useAdminFamilies.ts src/components/admin/AdminUsersTab.tsx
git commit -m "feat: show family and student avatars in admin users tab (read-only)"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Migration (Task 1) ✓, Types (Task 2) ✓, Storage helpers (Task 3) ✓, Mutations (Task 4) ✓, Upload UI (Tasks 5-7) ✓, Messages (Task 8) ✓, Admin (Task 9) ✓
- [x] **Placeholder scan:** All code blocks are complete. No TBDs.
- [x] **Type consistency:** `uploadProfileImage`/`deleteProfileImage` used consistently across Tasks 3, 6, 7. `updateProfileAvatar`/`updateStudentPhoto` defined in Task 4, used in Tasks 6, 7. `PhotoUploader` defined in Task 5, used in Tasks 6, 7. `avatarUrl` on `User` defined in Task 2, populated in Task 3, consumed in Tasks 6, 8. `photo_url` on `Student` defined in Task 2, mapped to `photoUrl` in `StudentRow` (Task 9) and local `Student` UI type (Task 7).
- [x] **Scope check:** 9 tasks, one natural delivery (migration → types → storage → mutations → component → UI layers). Could be shipped task-by-task.
