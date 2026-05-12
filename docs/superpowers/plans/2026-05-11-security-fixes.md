# Security Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all findings from the May 2026 security audit — 2 critical, 3 high, 5 medium, 4 low.

**Architecture:** Most fixes are Supabase migrations (new SQL files applied via MCP), targeted edits to edge function source, one React hook change, and a vercel.json update. No new tables, RPCs, or frontend components are added.

**Tech Stack:** React + Vite, Supabase (PostgREST, RLS, Edge Functions / Deno), Vercel

---

## Manual Pre-Work (do before running tasks)

These two items cannot be automated and must be done by the developer directly.

### Rotate WEBHOOK_SECRET (Vuln 1 — Critical)

The `WEBHOOK_SECRET` value was committed to git history and must be treated as compromised regardless of git cleanup.

1. Go to **Supabase Dashboard → Project Settings → Edge Functions → Environment Variables**
2. Delete the current `WEBHOOK_SECRET` value and generate a new one (e.g. `openssl rand -hex 32`)
3. Save the new value in your local `.env` (not committed — `.env` is in `.git/info/exclude`)
4. Verify the `send-email` edge function still receives webhook calls after rotation

Git history cleanup (do before any repo sharing):
```bash
# Install git-filter-repo if not present: pip install git-filter-repo
git filter-repo --path .env --invert-paths --force
git filter-repo --path supabase/functions/send-email/index.ts --invert-paths --force
# Note: filter-repo rewrites history. Coordinate with all repo collaborators.
```

### Acknowledge PII in migrations (Vuln 5 — Medium)

The email `owner@lbmartialarts.com` is hard-coded in migrations 002, 007, 018, 029, 033. These are historical facts in applied migrations — do not edit the migration files themselves (it would break Supabase migration tracking). Before any public repo sharing, run:
```bash
git filter-repo --replace-text <(echo "owner@lbmartialarts.com==>owner@lbmartialarts.com") --force
```
This is non-urgent until the repo becomes public.

---

## File Map

| File | Change |
|---|---|
| `supabase/migrations/035_restrict_get_admin_emails.sql` | Create — restrict `get_admin_emails()` to admins |
| `supabase/migrations/036_admin_only_blog_posts.sql` | Create — lock blog post + announcement comment INSERT to admins |
| `supabase/migrations/037_fix_unread_count_search_path.sql` | Create — add `SET search_path = public` to `get_total_unread_count` |
| `supabase/migrations/038_enrollment_lead_soft_delete_rls.sql` | Create — filter `deleted_at IS NULL` in admin SELECT policy |
| `supabase/migrations/039_profile_pictures_mime_validation.sql` | Create — reject non-image MIME types in storage policies |
| `supabase/migrations/040_handle_new_user_invitation_status_guard.sql` | Create — guard trigger's role lookup with `invitation_status = 'invited'` |
| `supabase/functions/send-email/index.ts` | Modify — remove auth fallback-to-true when `WEBHOOK_SECRET` unset |
| `supabase/functions/send-email/templates.ts` | Modify — HTML-escape user-supplied values before interpolation |
| `supabase/functions/invite-family/index.ts` | Modify — scope CORS to production origin |
| `supabase/functions/invite-admin/index.ts` | Modify — scope CORS to production origin |
| `supabase/functions/approve-enrollment-lead/index.ts` | Modify — scope CORS to production origin |
| `supabase/functions/deny-enrollment-lead/index.ts` | Modify — scope CORS to production origin |
| `supabase/functions/resend-booking-link/index.ts` | Modify — scope CORS to production origin |
| `supabase/functions/admin-book-appointment/index.ts` | Modify — scope CORS to production origin |
| `supabase/functions/book-appointment/index.ts` | Modify — scope CORS to production origin |
| `supabase/functions/confirm-appointment/index.ts` | Modify — scope CORS to production origin |
| `src/hooks/useAuth.ts` | Modify — clear URL hash before async `setSession` call |
| `vercel.json` | Modify — add security response headers |

---

## Task 1: Fix `send-email` auth fallback (Vuln 2 — High)

**Files:**
- Modify: `supabase/functions/send-email/index.ts:322-332`

The current code falls back to `true` (allow all callers) when `WEBHOOK_SECRET` is not set in the environment. This must be removed.

- [ ] **Step 1: Edit the authorization check**

In `supabase/functions/send-email/index.ts`, replace lines 322–332:

```ts
// BEFORE
Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  // Accept service role key (Supabase DB webhook default) or explicit WEBHOOK_SECRET if set
  const isAuthorized =
    authHeader === `Bearer ${serviceRoleKey}` ||
    (webhookSecret ? authHeader === `Bearer ${webhookSecret}` : true)
  if (!isAuthorized) {
    return new Response('Unauthorized', { status: 401 })
  }
```

```ts
// AFTER
Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!serviceRoleKey && !webhookSecret) {
    console.error('send-email: neither SUPABASE_SERVICE_ROLE_KEY nor WEBHOOK_SECRET is configured')
    return new Response('Service misconfigured', { status: 500 })
  }
  const isAuthorized =
    (serviceRoleKey !== undefined && authHeader === `Bearer ${serviceRoleKey}`) ||
    (webhookSecret !== undefined && authHeader === `Bearer ${webhookSecret}`)
  if (!isAuthorized) {
    return new Response('Unauthorized', { status: 401 })
  }
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/send-email/index.ts
git commit -m "remove auth fallback-to-true in send-email when webhook secret unset"
```

---

## Task 2: Restrict `get_admin_emails()` to admins (Vuln 3 — High)

**Files:**
- Create: `supabase/migrations/035_restrict_get_admin_emails.sql`

The function currently grants EXECUTE to all `authenticated` users including family-role users.

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/035_restrict_get_admin_emails.sql
-- Restrict get_admin_emails() to admin callers only.
-- Previously callable by any authenticated user, exposing admin PII to family users.

CREATE OR REPLACE FUNCTION public.get_admin_emails()
RETURNS TABLE(user_id UUID, email TEXT, display_name TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
    SELECT p.user_id, u.email::TEXT, p.display_name
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.role = 'admin'
    ORDER BY p.display_name;
END;
$$;
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `apply_migration` MCP tool with:
- `name`: `035_restrict_get_admin_emails`
- `query`: (content of the file above)

- [ ] **Step 3: Verify**

Run this SQL in the Supabase SQL editor as a non-admin user to confirm it raises an exception:
```sql
-- Run as a family user (use anon or authenticated role without admin flag)
SELECT * FROM get_admin_emails();
-- Expected: ERROR: Access denied
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/035_restrict_get_admin_emails.sql
git commit -m "restrict get_admin_emails rpc to admin callers"
```

---

## Task 3: Lock blog post and announcement comment creation to admins (Vuln 4 — High)

**Files:**
- Create: `supabase/migrations/036_admin_only_blog_posts.sql`

Any authenticated user (including family) can currently INSERT, UPDATE, and DELETE blog posts. Fix: admin-only for all blog post mutations. For announcement comments: restrict INSERT to admins (users retain UPDATE/DELETE on their own existing comments).

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/036_admin_only_blog_posts.sql
-- Restrict blog post creation/edit/delete to admins.
-- Restrict announcement comment creation to admins.
-- Family users retain ability to edit/delete their own existing comments.

-- Blog posts
DROP POLICY IF EXISTS "Authenticated users can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can update their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can delete their own blog posts" ON public.blog_posts;

CREATE POLICY "Admins can create blog posts"
  ON public.blog_posts FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update blog posts"
  ON public.blog_posts FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete blog posts"
  ON public.blog_posts FOR DELETE
  USING (is_admin(auth.uid()));

-- Announcement comments
DROP POLICY IF EXISTS "Authenticated users can create announcement comments" ON public.announcement_comments;

CREATE POLICY "Admins can create announcement comments"
  ON public.announcement_comments FOR INSERT
  WITH CHECK (is_admin(auth.uid()));
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `apply_migration` MCP tool with:
- `name`: `036_admin_only_blog_posts`
- `query`: (content of the file above)

- [ ] **Step 3: Verify**

Run as a family user (non-admin `authenticated`):
```sql
INSERT INTO blog_posts (title, content, author_user_id)
VALUES ('test', 'test', auth.uid());
-- Expected: ERROR: new row violates row-level security policy
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/036_admin_only_blog_posts.sql
git commit -m "restrict blog post and announcement comment creation to admins"
```

---

## Task 4: Fix magic link access token in URL hash (Vuln 6 — Medium)

**Files:**
- Modify: `src/hooks/useAuth.ts:25-54`

The URL hash containing the access token is cleared *after* the async `setSession` call. Clear it immediately on detection to minimize the window.

- [ ] **Step 1: Edit `useAuth.ts`**

In `src/hooks/useAuth.ts`, replace lines 25–54:

```ts
// BEFORE
if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (!error) {
      session = data.session;

      // Clean the URL (remove the hash and ensure we stay on /dashboard for magic-link)
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (url.pathname === '/') {
          url.pathname = '/dashboard';
        }
        window.history.replaceState(
          window.history.state,
          '',
          url.pathname + url.search
        );
      }
    } else {
      console.error('Error setting session from magic link:', error);
    }
  }
}
```

```ts
// AFTER
if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken && refreshToken) {
    // Clear the hash immediately before the async call so the token is
    // not present in the URL during the setSession round-trip.
    const url = new URL(window.location.href);
    if (url.pathname === '/') url.pathname = '/dashboard';
    window.history.replaceState(window.history.state, '', url.pathname + url.search);

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (!error) {
      session = data.session;
    } else {
      console.error('Error setting session from magic link:', error);
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "clear magic link hash before setSession to minimize token exposure"
```

---

## Task 5: Fix `get_total_unread_count` missing search path (Vuln 7 — Medium)

**Files:**
- Create: `supabase/migrations/037_fix_unread_count_search_path.sql`

This is the only `SECURITY DEFINER` function without `SET search_path = public`.

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/037_fix_unread_count_search_path.sql
-- Add SET search_path = public to get_total_unread_count, consistent with
-- all other SECURITY DEFINER functions in this schema.

CREATE OR REPLACE FUNCTION get_total_unread_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT SUM(msg_count)::INTEGER
      FROM (
        SELECT (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.conversation_id = cm.conversation_id
            AND m.author_user_id <> auth.uid()
            AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at)
        )::INTEGER AS msg_count
        FROM conversation_members cm
        WHERE cm.user_id = auth.uid()
      ) sub
    ),
    0
  )::INTEGER;
$$;
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `apply_migration` MCP tool with:
- `name`: `037_fix_unread_count_search_path`
- `query`: (content of the file above)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/037_fix_unread_count_search_path.sql
git commit -m "add set search_path to get_total_unread_count security definer function"
```

---

## Task 6: Filter soft-deleted leads from admin SELECT policy (Vuln 8 — Medium)

**Files:**
- Create: `supabase/migrations/038_enrollment_lead_soft_delete_rls.sql`

Soft-deleted leads (with `deleted_at IS NOT NULL`) are visible to admins via the current SELECT policy. Admins reviewing the list should only see active leads.

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/038_enrollment_lead_soft_delete_rls.sql
-- Exclude soft-deleted leads from the admin SELECT policy so that
-- leads marked deleted_at IS NOT NULL are not visible in the admin UI.

DROP POLICY IF EXISTS "Admins can view enrollment leads" ON public.enrollment_leads;

CREATE POLICY "Admins can view enrollment leads"
  ON public.enrollment_leads FOR SELECT
  USING (is_admin(auth.uid()) AND deleted_at IS NULL);
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `apply_migration` MCP tool with:
- `name`: `038_enrollment_lead_soft_delete_rls`
- `query`: (content of the file above)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/038_enrollment_lead_soft_delete_rls.sql
git commit -m "exclude soft-deleted enrollment leads from admin select policy"
```

---

## Task 7: Add MIME type validation to profile picture storage policies (Vuln 9 — Medium)

**Files:**
- Create: `supabase/migrations/039_profile_pictures_mime_validation.sql`

Upload policies currently accept any file type. Add a MIME type check using the `metadata` column so that SVG and other non-image types are rejected at the storage layer.

Note: `metadata->>'mimetype'` is supplied by the client but still prevents accidental or casual abuse. It specifically blocks SVG uploads (which could contain embedded scripts) since their MIME type would be `image/svg+xml`, which is not in the allowlist.

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/039_profile_pictures_mime_validation.sql
-- Add MIME type checks to profile-pictures storage INSERT and UPDATE policies.
-- Rejects any upload whose reported content-type is not a raster image format.

-- Account avatar
DROP POLICY IF EXISTS "families upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "families update own avatar" ON storage.objects;

CREATE POLICY "families upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND name = 'profiles/' || auth.uid()::text || '/avatar'
  AND (metadata->>'mimetype') IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif')
);

CREATE POLICY "families update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND name = 'profiles/' || auth.uid()::text || '/avatar'
)
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND name = 'profiles/' || auth.uid()::text || '/avatar'
  AND (metadata->>'mimetype') IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif')
);

-- Student photos
DROP POLICY IF EXISTS "families upload student photo" ON storage.objects;
DROP POLICY IF EXISTS "families update student photo" ON storage.objects;

CREATE POLICY "families upload student photo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND (metadata->>'mimetype') IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif')
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
)
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND (metadata->>'mimetype') IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif')
  AND EXISTS (
    SELECT 1 FROM students s
    JOIN families f ON s.family_id = f.family_id
    WHERE 'students/' || s.student_id::text || '/photo' = name
      AND f.owner_user_id = auth.uid()
  )
);
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `apply_migration` MCP tool with:
- `name`: `039_profile_pictures_mime_validation`
- `query`: (content of the file above)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/039_profile_pictures_mime_validation.sql
git commit -m "add mime type validation to profile pictures storage policies"
```

---

## Task 8: HTML-escape user input in email templates (Vuln 10 — Low)

**Files:**
- Modify: `supabase/functions/send-email/templates.ts`

`lead.parent_name`, `lead.parent_email`, `lead.phone`, `lead.student_name`, and `lead.message` are interpolated directly into HTML. Add an escape function and apply it everywhere user data enters a template string.

- [ ] **Step 1: Add `escHtml` and apply it in `templates.ts`**

Add the escape function immediately after the imports (after line 3), then wrap every user-supplied field:

```ts
// After the import line, add:
function escHtml(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
```

Then in `enrollmentNotificationHtml`, replace the raw interpolations:

```ts
// BEFORE
const rows = [
  `<tr><td style="padding:4px 0;font-weight:700;color:#1a1a2e;width:110px;">Parent</td><td style="padding:4px 0;color:#555;">${lead.parent_name}</td></tr>`,
  `<tr><td style="padding:4px 0;font-weight:700;color:#1a1a2e;">Email</td><td style="padding:4px 0;color:#555;">${lead.parent_email}</td></tr>`,
  lead.phone ? `<tr><td style="padding:4px 0;font-weight:700;color:#1a1a2e;">Phone</td><td style="padding:4px 0;color:#555;">${lead.phone}</td></tr>` : '',
  lead.student_name ? `<tr><td style="padding:4px 0;font-weight:700;color:#1a1a2e;">Student</td><td style="padding:4px 0;color:#555;">${lead.student_name}${lead.student_age ? ` (age ${lead.student_age})` : ''}</td></tr>` : '',
  lead.message ? `<tr><td style="padding:4px 0;font-weight:700;color:#1a1a2e;vertical-align:top;">Message</td><td style="padding:4px 0;color:#555;">${lead.message}</td></tr>` : '',
].join('')
```

```ts
// AFTER
const rows = [
  `<tr><td style="padding:4px 0;font-weight:700;color:#1a1a2e;width:110px;">Parent</td><td style="padding:4px 0;color:#555;">${escHtml(lead.parent_name)}</td></tr>`,
  `<tr><td style="padding:4px 0;font-weight:700;color:#1a1a2e;">Email</td><td style="padding:4px 0;color:#555;">${escHtml(lead.parent_email)}</td></tr>`,
  lead.phone ? `<tr><td style="padding:4px 0;font-weight:700;color:#1a1a2e;">Phone</td><td style="padding:4px 0;color:#555;">${escHtml(lead.phone)}</td></tr>` : '',
  lead.student_name ? `<tr><td style="padding:4px 0;font-weight:700;color:#1a1a2e;">Student</td><td style="padding:4px 0;color:#555;">${escHtml(lead.student_name)}${lead.student_age ? ` (age ${lead.student_age})` : ''}</td></tr>` : '',
  lead.message ? `<tr><td style="padding:4px 0;font-weight:700;color:#1a1a2e;vertical-align:top;">Message</td><td style="padding:4px 0;color:#555;">${escHtml(lead.message)}</td></tr>` : '',
].join('')
```

Also search `templates.ts` for any other uses of `lead.parent_name`, `lead.parent_email`, `lead.message`, `lead.student_name`, `lead.phone` and wrap each with `escHtml(...)`.

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/send-email/templates.ts
git commit -m "html-escape user-supplied values in email templates"
```

---

## Task 9: Scope CORS to production origin (Vuln 11 — Low)

**Files:**
- Modify: `supabase/functions/invite-family/index.ts`
- Modify: `supabase/functions/invite-admin/index.ts`
- Modify: `supabase/functions/approve-enrollment-lead/index.ts`
- Modify: `supabase/functions/deny-enrollment-lead/index.ts`
- Modify: `supabase/functions/resend-booking-link/index.ts`
- Modify: `supabase/functions/admin-book-appointment/index.ts`
- Modify: `supabase/functions/book-appointment/index.ts`
- Modify: `supabase/functions/confirm-appointment/index.ts`

Each file has `'Access-Control-Allow-Origin': '*'`. Replace with the production origin.

- [ ] **Step 1: In each of the 8 files, replace the `CORS_HEADERS` constant**

The same change applies to all 8 files. Find:
```ts
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

Replace with:
```ts
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') ?? 'https://lbmartialarts.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

Apply this to all 8 files:
- `supabase/functions/invite-family/index.ts`
- `supabase/functions/invite-admin/index.ts`
- `supabase/functions/approve-enrollment-lead/index.ts`
- `supabase/functions/deny-enrollment-lead/index.ts`
- `supabase/functions/resend-booking-link/index.ts`
- `supabase/functions/admin-book-appointment/index.ts`
- `supabase/functions/book-appointment/index.ts`
- `supabase/functions/confirm-appointment/index.ts`

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/invite-family/index.ts \
        supabase/functions/invite-admin/index.ts \
        supabase/functions/approve-enrollment-lead/index.ts \
        supabase/functions/deny-enrollment-lead/index.ts \
        supabase/functions/resend-booking-link/index.ts \
        supabase/functions/admin-book-appointment/index.ts \
        supabase/functions/book-appointment/index.ts \
        supabase/functions/confirm-appointment/index.ts
git commit -m "scope cors to production origin in all edge functions"
```

---

## Task 10: Add security response headers (Vuln 12 — Low)

**Files:**
- Modify: `vercel.json`

Add `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy` headers to all responses.

- [ ] **Step 1: Edit `vercel.json`**

Replace the entire file:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "add security headers to vercel config"
```

---

## Task 11: Guard `handle_new_user` trigger role lookup (Vuln 14 — Low)

**Files:**
- Create: `supabase/migrations/040_handle_new_user_invitation_status_guard.sql`

The trigger reads `invited_as_role` without checking `invitation_status = 'invited'`. If an email is re-registered after being claimed, the old `invited_as_role` from the now-`active` row could be applied to the new signup. Adding the guard ensures only a pending invitation can assign a non-default role.

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/040_handle_new_user_invitation_status_guard.sql
-- Guard the handle_new_user trigger's role lookup so it only reads
-- invited_as_role when invitation_status = 'invited' (not already claimed).
-- Falls back to 'family' if the email has no pending invitation row.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT COALESCE(invited_as_role, 'family') INTO v_role
  FROM public.registered_emails
  WHERE email = lower(trim(NEW.email))
    AND invitation_status = 'invited';

  INSERT INTO public.profiles (user_id, role, display_name)
  VALUES (
    NEW.id,
    COALESCE(v_role, 'family'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.registered_emails (email, claimed_at, invitation_status)
  VALUES (lower(trim(NEW.email)), NOW(), 'active')
  ON CONFLICT (email) DO UPDATE
    SET claimed_at = COALESCE(public.registered_emails.claimed_at, EXCLUDED.claimed_at),
        invitation_status = 'active';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `apply_migration` MCP tool with:
- `name`: `040_handle_new_user_invitation_status_guard`
- `query`: (content of the file above)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/040_handle_new_user_invitation_status_guard.sql
git commit -m "guard handle_new_user role lookup to pending invitations only"
```

---

## Execution Order

Tasks can be executed in this order. Tasks 2–11 are independent and can be done in any sequence; Task 1 (secret rotation) must be done before deploying anything.

1. **Manual pre-work:** Rotate `WEBHOOK_SECRET` (required before any deploy)
2. Task 1 — `send-email` auth fix
3. Task 2 — restrict `get_admin_emails`
4. Task 3 — blog posts RLS
5. Task 5 — `get_total_unread_count` search path
6. Task 6 — soft-delete RLS
7. Task 7 — MIME validation
8. Task 11 — trigger guard
9. Task 4 — magic link hash
10. Task 8 — email HTML escaping
11. Task 9 — CORS scoping
12. Task 10 — security headers
13. **Manual post-work:** Git history cleanup for `.env` and PII (before any repo sharing)
