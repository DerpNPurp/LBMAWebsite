# Email Infrastructure Design

**Date:** 2026-04-13
**Scope:** Full email sending infrastructure for LBMAA — auth emails, messaging notifications, enrollment notifications, and future transactional emails.

---

## Problem

Supabase's built-in email sender has a hard cap of 2 emails/hour. With ~200 users relying on magic link auth, this is insufficient. Additionally, enrollment lead notifications are currently queued in the DB (`enrollment_lead_notifications.status = 'queued'`) but never actually sent. Messaging notifications do not exist yet.

## Goal

Replace Supabase's internal email sender with Resend, and build a single Edge Function that handles all app-triggered transactional emails.

---

## Provider: Resend

- **Free tier:** 3,000 emails/month, 100/day — covers ~200 users indefinitely
- **Custom SMTP:** works as a drop-in for Supabase's Custom SMTP setting (fixes auth rate limit)
- **SDK:** TypeScript-first, clean API, idiomatic for Supabase Edge Functions (Deno)
- **Domain:** send from `onboarding@resend.dev` until a custom domain is set up; migrate to `noreply@lbmaa.com` by adding DNS records in Resend and updating one field in Supabase

---

## Architecture

Two separate email paths:

### Path 1 — Auth Emails (Custom SMTP, no code)

Supabase routes all auth emails (magic links) through Resend's SMTP relay. Configuration only — no edge function involved.

**Supabase Dashboard → Authentication → SMTP Settings:**
| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) |
| Username | `resend` |
| Password | Resend API key |
| Sender address | `onboarding@resend.dev` (swap for `noreply@lbmaa.com` when domain is ready) |
| Sender name | `Los Banos Martial Arts Academy` |

The branded magic link template (see `2026-04-09-auth-email-template-design.md`) is pasted into **Authentication → Email Templates → Magic Link** in the Supabase dashboard.

### Path 2 — Transactional Emails (Edge Function)

A single Edge Function `send-email` handles all app-triggered emails. It is invoked by Supabase Database Webhooks — no polling.

**Function:** `supabase/functions/send-email/index.ts`

**Payload types:**
```ts
type EmailPayload =
  | { type: 'enrollment_notification'; lead: EnrollmentLead }
  | { type: 'enrollment_confirmation'; lead: EnrollmentLead }
  | { type: 'messaging_notification'; recipientEmail: string; senderName: string; conversationId: string }
```

**Database webhooks:**
| Trigger | Table / Event | Recipient |
|---|---|---|
| New enrollment lead submitted | `enrollment_lead_notifications` INSERT | Admin |
| Enrollment confirmed | `enrollment_leads.notification_status` UPDATE to `'sent'` by admin | Family |
| New message received | `messages` INSERT | Recipient (family or admin) |

**Enrollment lead notifications:** after sending, the function updates `enrollment_lead_notifications.status` to `sent` or `failed` so delivery state is visible in the admin dashboard.

**Messaging notifications guard:** only send if `conversation_members.last_read_at` is older than the message timestamp — no point emailing someone already active in the app.

**Secrets:** `RESEND_API_KEY` stored as a Supabase secret, accessed via `Deno.env.get('RESEND_API_KEY')`. Never hardcoded.

---

## Email Templates

All templates use inline-style HTML (no external CSS, no images) for email client compatibility. Visual identity follows the magic link reference design: red-to-dark gradient stripe, LBMAA header, red CTA button, footer with contact info.

Templates are TypeScript string functions colocated inside the edge function:

| Template function | Trigger | Recipient |
|---|---|---|
| `magicLinkHtml()` | Auth sign-in request | Family |
| `enrollmentNotificationHtml(lead)` | New contact form submission | Admin |
| `enrollmentConfirmationHtml(lead)` | Admin confirms enrollment | Family |
| `messagingNotificationHtml(senderName, conversationId)` | New unread message | Family or Admin |

Colors (consistent across all templates):
- Red: `#c8102e`
- Dark: `#1a1a2e`
- Body text: `#555`
- Footer text: `#aaa` / `#bbb`

---

## Domain Migration Path

When `lbmaa.com` is acquired:
1. Add Resend DNS records (SPF, DKIM, DMARC) to the domain registrar
2. Verify domain in Resend dashboard
3. Update sender address in Supabase Custom SMTP settings to `noreply@lbmaa.com`
4. Update `from` field in the edge function's Resend API calls

No code changes required — only configuration.

---

## Out of Scope

- Email open/click tracking
- Unsubscribe management (no marketing emails)
- Other Supabase email types (invite, password reset, email change) — not used in this app
- React Email / external templating library — not needed at this scale
