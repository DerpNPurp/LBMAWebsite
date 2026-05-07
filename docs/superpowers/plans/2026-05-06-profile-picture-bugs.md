# Profile Picture Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three bugs in the profile picture feature: cropped uploads not applying visually, removed photos showing blank instead of initials, and the profile photo card showing wrong initials with the wrong background color.

**Architecture:** Three surgical fixes across three files. No structural changes. Bug 1 adds a cache-buster query param to the URL returned by the upload helper. Bug 2 adds a `key` prop to the Avatar in PhotoUploader to force Radix to remount on URL change. Bug 3 passes correct initials and applies the correct fallback background color.

**Tech Stack:** React, TypeScript, Radix UI Avatar, Supabase Storage, `src/lib/format.ts` (`getInitials`)

---

### Task 1: Cache-bust profile image uploads (Bug 1)

**Files:**
- Modify: `src/lib/supabase/storage.ts`

- [ ] **Step 1: Open `src/lib/supabase/storage.ts` and locate `uploadProfileImage`**

The function currently ends with:
```ts
export async function uploadProfileImage(path: string, file: File): Promise<string> {
  const { error } = await supabase.storage
    .from(PROFILE_PICTURES_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true });
  if (error) throw error;
  return getProfilePublicUrl(path);
}
```

- [ ] **Step 2: Append `?t={Date.now()}` to the returned URL**

```ts
export async function uploadProfileImage(path: string, file: File): Promise<string> {
  const { error } = await supabase.storage
    .from(PROFILE_PICTURES_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true });
  if (error) throw error;
  return getProfilePublicUrl(path) + '?t=' + Date.now();
}
```

- [ ] **Step 3: Verify in the browser**

Start the dev server (`npm run dev`). Log in as a family account. Go to Profile tab → Profile Photo.
1. Upload a photo and crop it to one position, save.
2. Upload the same (or a different) photo again, crop to a clearly different position, save.
3. **Expected:** The avatar in the Profile Photo card updates immediately to show the new crop. The old image does not persist.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/storage.ts
git commit -m "cache-bust profile image urls on upload"
```

---

### Task 2: Fix blank avatar after photo removal (Bug 2)

**Files:**
- Modify: `src/components/dashboard/PhotoUploader.tsx`

- [ ] **Step 1: Open `src/components/dashboard/PhotoUploader.tsx` and locate the `Avatar` element**

It currently reads:
```tsx
<Avatar className={sizeClasses[size]}>
  {currentUrl && <AvatarImage src={currentUrl} alt="Profile photo" />}
  <AvatarFallback className="text-lg">{fallback}</AvatarFallback>
</Avatar>
```

- [ ] **Step 2: Add a `key` prop to `Avatar` that changes when `currentUrl` goes to null**

```tsx
<Avatar key={currentUrl ?? 'no-image'} className={sizeClasses[size]}>
  {currentUrl && <AvatarImage src={currentUrl} alt="Profile photo" />}
  <AvatarFallback className="text-lg">{fallback}</AvatarFallback>
</Avatar>
```

This causes React to unmount and remount the Radix Avatar when the URL changes to null, resetting its internal image-loading state to `'idle'` so `AvatarFallback` renders immediately.

- [ ] **Step 3: Verify in the browser**

With the dev server running, go to Profile tab → Profile Photo.
1. Upload a photo (any image).
2. Click "Remove Photo" and confirm.
3. **Expected:** The avatar immediately shows the initials fallback — it does not go blank. No page reload required.
4. Reload the page and confirm the initials avatar still appears (not blank).

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/PhotoUploader.tsx
git commit -m "fix blank avatar after photo removal by remounting on key change"
```

---

### Task 3: Fix initials and background color in profile photo card (Bug 3)

**Files:**
- Modify: `src/components/dashboard/PhotoUploader.tsx`
- Modify: `src/components/dashboard/ProfileTab.tsx`

- [ ] **Step 1: Fix the `AvatarFallback` background color in `PhotoUploader.tsx`**

The current `AvatarFallback` uses the shadcn default (`bg-muted`, gray). Change it to match the sidebar avatar style used everywhere else in the app:

```tsx
<AvatarFallback className="text-lg bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
  {fallback}
</AvatarFallback>
```

- [ ] **Step 2: Fix the initials passed to the profile photo `PhotoUploader` in `ProfileTab.tsx`**

At the top of `ProfileTab.tsx`, `getInitials` is not yet imported. Add it to the existing import from `../../lib/format`:

```ts
import { getInitials } from '../../lib/format';
```

Then find the profile photo `PhotoUploader` (inside the "Profile Photo" `Card`, around line 512). Its `fallback` prop currently reads:

```tsx
fallback={user.displayName?.[0] ?? '?'}
```

Change it to:

```tsx
fallback={getInitials(user.displayName ?? '?')}
```

Do not touch the student photo `PhotoUploader` instances — they already pass `${firstName[0]}${lastName[0]}` which is correct.

- [ ] **Step 3: Verify in the browser**

Go to Profile tab → Profile Photo section (while no photo is uploaded, or after removing one).

1. **Expected:** The avatar shows all initials extracted from the display name (e.g. "KG" for "KJN Guerra"), not just the first character ("K").
2. **Expected:** The fallback avatar background is the brand red (`bg-sidebar-primary`), matching the avatar shown in the sidebar and everywhere else in the app.
3. Check that student photo avatars are unchanged (still show two-character initials with default styling).

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/PhotoUploader.tsx src/components/dashboard/ProfileTab.tsx
git commit -m "fix profile photo fallback initials and background color"
```
