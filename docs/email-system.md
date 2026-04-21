# Email System — Full Reference

This document covers everything about how emails are sent in this app: the architecture, every email type, the templates, the delivery service, and the design decisions behind each choice.

---

## Table of Contents

1. [Big Picture](#1-big-picture)
2. [The Outbox Pattern](#2-the-outbox-pattern)
3. [The `enrollment_lead_notifications` Table](#3-the-enrollment_lead_notifications-table)
4. [The Database Webhook](#4-the-database-webhook)
5. [The `send-email` Edge Function](#5-the-send-email-edge-function)
6. [All Email Types](#6-all-email-types)
7. [Email Templates](#7-email-templates)
8. [Sending via Resend](#8-sending-via-resend)
9. [Message Notification Emails](#9-message-notification-emails)
10. [Environment Variables](#10-environment-variables)
11. [Testing](#11-testing)
12. [What's Not Wired Yet](#12-whats-not-wired-yet)
13. [Design Decisions](#13-design-decisions)
14. [Glossary](#14-glossary)

---

## 1. Big Picture

The email system has three layers:

```
Layer 1: Something happens in the app
         (form submitted, admin approves a lead, appointment booked, etc.)
                │
                ▼
Layer 2: A notification row is inserted into
         `enrollment_lead_notifications` with status = 'queued'
                │
                ▼  (Supabase database webhook fires on INSERT)
Layer 3: `send-email` Edge Function
         ├─ Reads the notification row
         ├─ Fetches the full lead record
         ├─ Picks the right email template
         ├─ Calls Resend API to deliver the email
         └─ Updates the notification row to status = 'sent'
```

**Key idea:** The app never calls the email API directly. It only writes a row to a table. The email happens separately, asynchronously. This separation is the **outbox pattern** and it's the central design decision of the whole system.

---

## 2. The Outbox Pattern

> **What is the outbox pattern?** Instead of sending an email inside the same operation that updates your database (risky — what if one succeeds and the other fails?), you first write a record saying "I want to send this email," then a separate process handles the actual sending.

### Why this matters

Imagine an admin approves a lead. The app needs to:
1. Update `enrollment_leads.status = 'approved'`
2. Send the prospect an email

If these happen in a sequence, there's a window where one can succeed and the other can fail:

| Scenario | Result without outbox |
|---|---|
| DB update succeeds, email API call fails | Lead is approved but prospect never gets the email |
| Email API call succeeds, DB update fails | Prospect gets an email but lead is still `new` in the system |

With the outbox pattern, the DB update and the notification row insert happen in the same database transaction. Both succeed or both fail together. The email delivery (which might fail due to network issues or a third-party API being down) is completely decoupled and can be retried independently.

---

## 3. The `enrollment_lead_notifications` Table

**Defined in:** `supabase/migrations/002_public_enrollment_leads.sql` and extended in `016_enrollment_lead_flow.sql`, `018_submission_notification_and_admin_emails.sql`

This is the outbox — a queue of emails waiting to be sent.

| Column | Type | Purpose |
|---|---|---|
| `notification_id` | UUID | Primary key, auto-generated |
| `lead_id` | UUID | Foreign key referencing `enrollment_leads` |
| `recipient_email` | TEXT | The email address to deliver to |
| `channel` | TEXT | Always `'email'` today; `'sms'` is reserved for future use |
| `type` | TEXT | Which email template to use (see §6) |
| `status` | TEXT | `'queued'`, `'sent'`, or `'failed'` |
| `error_message` | TEXT | Populated if delivery fails |
| `created_at` | TIMESTAMPTZ | When the notification was queued |

### Constraints (data rules enforced by the database)

```sql
channel IN ('email', 'sms')
type    IN ('new_lead', 'submission', 'approval', 'denial',
            'booking_confirmation', 'reminder')
status  IN ('queued', 'sent', 'failed')
```

These `CHECK` constraints mean the database will reject any invalid value — a typo like `'aproval'` would throw an error before the row is ever inserted.

### Relationship to `enrollment_leads`

The notification row references its lead via `lead_id`. This is a **foreign key** — PostgreSQL guarantees the referenced lead exists. If a lead is deleted, all its notifications are automatically deleted too (`ON DELETE CASCADE`).

---

## 4. The Database Webhook

> **What is a webhook?** A webhook is an HTTP call that fires automatically when something happens. Instead of your code manually calling a function, the platform calls a URL you've specified.

Supabase lets you configure a **database webhook** on a table and event. In this system:

- **Table:** `enrollment_lead_notifications`
- **Event:** `INSERT`
- **Target URL:** The `send-email` edge function's public URL

When any row is inserted into `enrollment_lead_notifications`, Supabase immediately makes a POST request to the `send-email` function, passing the new row as JSON in the request body.

### What the webhook payload looks like

```json
{
  "type": "INSERT",
  "table": "enrollment_lead_notifications",
  "schema": "public",
  "record": {
    "notification_id": "...",
    "lead_id": "...",
    "recipient_email": "parent@example.com",
    "channel": "email",
    "type": "approval",
    "status": "queued",
    "created_at": "2026-04-16T10:00:00Z"
  },
  "old_record": null
}
```

The `send-email` function receives this payload and uses `record.type` to know which email to send.

### Webhook security

The webhook includes the **service role key** as a `Bearer` token in the `Authorization` header. The `send-email` function checks this header:

```typescript
const isAuthorized =
  authHeader === `Bearer ${serviceRoleKey}` ||
  (webhookSecret ? authHeader === `Bearer ${webhookSecret}` : true)
```

It accepts the service role key (Supabase's default) or a separate `WEBHOOK_SECRET` if configured. This prevents random internet traffic from triggering the function.

---

## 5. The `send-email` Edge Function

**File:** `supabase/functions/send-email/index.ts`

This is the central email dispatcher. It's invoked by the database webhook and routes each notification to the right handler.

### Entry point flow

```
Webhook POST arrives
        │
        ▼
Is Authorization header valid?  → No → 401 Unauthorized
        │ Yes
        ▼
Is the HTTP method POST?        → No → 405 Method Not Allowed
        │ Yes
        ▼
Parse the JSON payload
        │
        ▼
Is payload.type === 'INSERT'?   → No → 200 OK (do nothing — we only act on inserts)
        │ Yes
        ▼
Which table?
   ├── enrollment_lead_notifications → handleEnrollmentNotification()
   └── messages                     → handleMessageNotification()
```

### `handleEnrollmentNotification()`

1. Fetches the full lead record from `enrollment_leads` using `record.lead_id`.
2. Builds URLs:
   - `adminUrl` = `APP_URL + '/admin'`
   - `bookingUrl` = `APP_URL + '/book/' + lead.booking_token`
   - `confirmUrl` = `APP_URL + '/confirm/' + lead.booking_token`
3. Switches on `record.type` to pick the right template and subject line.
4. For `new_lead` specifically: fans out to multiple admin recipients (see §6).
5. Calls `sendEmail(to, subject, html)`.
6. Updates the notification row to `status = 'sent'`.

### `handleMessageNotification()`

Handles portal message notification emails (see §9).

### `sendEmail()`

A thin wrapper around the Resend API. Takes a `to` address, `subject`, and `html` body, makes a POST to `https://api.resend.com/emails`, and throws an error if Resend returns a non-OK response.

```typescript
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend error ${res.status}: ${body}`)
  }
}
```

---

## 6. All Email Types

There are six notification types. Here's every detail about each one.

---

### `new_lead` — New inquiry alert for admins

**Recipient:** All admins with `notify_new_leads = true` in `admin_notification_settings`. Falls back to the `recipient_email` on the notification row if no admins are configured.

**When queued:** Inside `submit_enrollment_lead()` RPC, immediately when a prospect submits the contact form.

**Subject:** `New enrollment inquiry — {parent_name}`

**Content:** A summary table of the lead's contact info (name, email, phone, student name/age, message), with a "View in Admin Dashboard" button linking to `/admin`.

**Fan-out logic:** This is the only email type that potentially sends to multiple recipients in one notification. The function queries `admin_notification_settings` and sends the same email to each matching admin:

```typescript
const { data: admins } = await supabase
  .from('admin_notification_settings')
  .select('email')
  .eq('notify_new_leads', true)
  .eq('is_active', true)

const recipients = admins?.length > 0
  ? admins.map(a => a.email)
  : [record.recipient_email]  // fallback

await Promise.all(recipients.map(to => sendEmail(to, subject, html)))
```

---

### `submission` — Thank-you confirmation to prospect

**Recipient:** The prospect (their email from the form).

**When queued:** Inside `submit_enrollment_lead()` RPC, at the same time as the `new_lead` notification — so two rows are inserted atomically when a form is submitted.

**Subject:** `Thank you for your interest in LBMAA`

**Content:** Confirms receipt of the inquiry, sets expectation of 1–2 business day response, shows back the submitted student name and contact email for the prospect's reference.

---

### `approval` — Booking link sent to prospect

**Recipient:** The prospect.

**When queued:**
- When an admin clicks "Approve & Send Invite" (`approve-enrollment-lead` edge function)
- When an admin clicks "Resend Booking Link" (`resend-booking-link` edge function)
- When an admin creates a new lead and chooses "Send Booking Link" (`NewLeadModal`)

**Subject:** `Your enrollment request — book your appointment`

**Content:** A congratulatory message and a prominent "Book Your Appointment" button linking to `/book/{booking_token}`. Includes a warning not to share the link (it's unique to them).

**Note:** The same `approval` type is used for both the initial send and any resends. The booking URL is the same each time (same token, permanent link). Resending just re-queues the same template.

---

### `denial` — Rejection notice to prospect

**Recipient:** The prospect.

**When queued:** When an admin confirms a denial in the DenyModal (`deny-enrollment-lead` edge function).

**Subject:** `Your enrollment inquiry at LBMAA`

**Content:** The custom denial message the admin wrote, or a default fallback: *"Thank you for your interest in LBMAA. Unfortunately, we are unable to accommodate your enrollment request at this time."*

---

### `booking_confirmation` — Appointment booked

**Recipient:** The prospect.

**When queued:**
- When the prospect books via the public booking page (`book-appointment` edge function)
- When an admin books on their behalf (`admin-book-appointment` edge function)

**Subject:** `Appointment confirmed — LBMAA`

**Content:** A styled box showing the appointment date (formatted as e.g. "Wednesday, April 22, 2026") and time. Includes a "Click here to reschedule" link pointing back to the booking page (same `/book/{token}` URL).

---

### `reminder` — 2-day reminder before appointment

**Recipient:** The prospect.

**When queued:** Not currently wired to an automatic trigger. The template and notification type exist, but there is no scheduler or cron job inserting these rows yet (see §12).

**Subject:** `Reminder: your LBMAA appointment in 2 days`

**Content:** Shows the appointment date/time, a "Confirm My Attendance" button (linking to `/confirm/{token}`, handled by the `confirm-appointment` edge function), and a reschedule link.

---

## 7. Email Templates

**File:** `supabase/functions/send-email/templates.ts`

All templates are TypeScript functions that return an HTML string. They take data (a lead record, a URL) as arguments and produce self-contained HTML ready to be sent.

### Shared structure

Every template goes through a `wrap()` function that adds the common shell:

```
┌─────────────────────────────────────┐
│  Red/navy gradient stripe           │  ← brand accent
│  Header: "Los Banos Martial Arts    │
│          Academy / Member Family    │
│          Portal"                    │
├─────────────────────────────────────┤
│                                     │
│  [template-specific content]        │
│                                     │
│  ─────────────────────────────────  │
│  Footer: "Need help? info@lbmaa.com"│
└─────────────────────────────────────┘
```

### Why inline styles?

All CSS in the templates is written as `style="..."` directly on HTML elements, not in a `<style>` block or an external stylesheet. Email clients (Gmail, Outlook, Apple Mail) are notorious for stripping `<style>` blocks and ignoring external CSS. Inline styles are the only reliable way to control appearance across all clients.

### The `ctaButton()` helper

Every template with a call-to-action uses a shared helper that produces a consistent styled button:

```typescript
function ctaButton(href: string, label: string): string {
  return `<div style="text-align:center;margin-bottom:20px;">
    <a href="${href}" style="display:inline-block;background:#c8102e;color:#fff;
    font-weight:700;padding:13px 36px;border-radius:4px;text-decoration:none;
    font-size:14px;letter-spacing:0.5px;">${label}</a>
  </div>`
}
```

The button is an `<a>` tag styled to look like a button, not an actual `<button>` element. This is also an email standard — `<button>` elements are unreliable in many email clients.

### Template functions

| Function | Used for | Key data used |
|---|---|---|
| `enrollmentNotificationHtml(lead, adminUrl)` | `new_lead` emails to admins | All lead fields, link to `/admin` |
| `submissionConfirmationHtml(lead)` | `submission` thank-you to prospect | `parent_name`, `student_name`, `parent_email` |
| `approvalEmailHtml(lead, bookingUrl)` | `approval` booking invite | `parent_name`, link to `/book/{token}` |
| `denialEmailHtml(lead)` | `denial` rejection | `parent_name`, `denial_message` (with fallback) |
| `bookingConfirmationHtml(lead, rebookingUrl)` | `booking_confirmation` | `parent_name`, `appointment_date`, `appointment_time`, rebook link |
| `reminderEmailHtml(lead, confirmUrl, rebookingUrl)` | `reminder` | `parent_name`, `appointment_date`, `appointment_time`, confirm link, rebook link |
| `messagingNotificationHtml(senderName, portalUrl)` | Portal message alerts | Sender's display name, link to `/dashboard` |

### Date/time formatting in templates

Dates stored in the database are plain strings (`YYYY-MM-DD` for dates, `HH:MM:SS` for times). Templates convert these to human-readable format:

```typescript
// Date: "2026-04-22" → "Wednesday, April 22, 2026"
new Date(lead.appointment_date + 'T12:00:00')
  .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

// Time: "16:00:00" → "4:00 PM"
new Date('1970-01-01T' + lead.appointment_time)
  .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
```

The `+ 'T12:00:00'` on dates is important: without a time component, `new Date('2026-04-22')` is parsed as UTC midnight, which can shift the displayed date by a day depending on the runtime's timezone. Adding `T12:00:00` (noon) makes it timezone-safe for formatting purposes.

---

## 8. Sending via Resend

**Service:** [Resend](https://resend.com) — a transactional email API.

**From address:** `Los Banos Martial Arts Academy <no-reply@notifications.lbmartialarts.com>`

**API endpoint:** `https://api.resend.com/emails`

**Authentication:** Bearer token from environment variable `RESEND_API_KEY`.

**Request format:**
```json
{
  "from": "Los Banos Martial Arts Academy <no-reply@notifications.lbmartialarts.com>",
  "to": ["recipient@example.com"],
  "subject": "...",
  "html": "..."
}
```

The Resend API is called with a raw `fetch()` rather than an SDK. This is common in Deno edge functions — the standard `fetch` API is built in, and adding an npm package would bloat the function's cold-start time.

If Resend returns a non-2xx status (e.g., 422 for a bad email address, 401 for a bad API key), `sendEmail()` throws an error. The `send-email` function's top-level handler catches this and returns a 500 to the webhook. The notification row stays in `'queued'` state — it is not marked `'failed'` in this error path.

> **Note on the domain:** The `from` domain is `notifications.lbmartialarts.com`, which requires proper DNS records (SPF, DKIM, DMARC) configured in Resend to prevent emails from landing in spam. This is a Resend account setup concern, not a code concern.

---

## 9. Message Notification Emails

Beyond enrollment, there is one other email type: a notification when someone sends a portal message.

**Trigger:** A database webhook on the `messages` table fires `send-email` on every `INSERT`.

**What `handleMessageNotification()` does:**

1. Looks up all conversation members except the author.
2. Checks the recipient's `last_read_at` timestamp — if they've read the conversation more recently than the message was created, the email is skipped (they're already online and aware).
3. Fetches the sender's `display_name` from `profiles`.
4. Looks up the recipient's email from `auth.users` (using the admin client, since email addresses aren't in `profiles`).
5. Sends an email using `messagingNotificationHtml()`.

**Subject:** `New message from {senderName} — LBMAA Portal`

**Content:** "senderName sent you a message in the LBMAA portal." + "Read Message" button to `/dashboard`. Includes a note: "Reply directly in the portal — do not reply to this email."

**Why check `last_read_at`?** Without this check, every message would send an email even if the recipient is actively reading the conversation in real time. The check acts as a basic "is this person active right now?" signal.

---

## 10. Environment Variables

The `send-email` function depends on these Supabase secrets (set in the Supabase dashboard under Edge Function secrets):

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | API key for Resend to authenticate email delivery |
| `APP_URL` | Base URL of the deployed app (e.g., `https://lbmaa.com`). Used to construct button links in emails. Falls back to `http://localhost:5173` if not set. |
| `SUPABASE_URL` | Your Supabase project URL. Auto-provided by Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key to bypass RLS. Auto-provided. Also used to authenticate the database webhook. |
| `SUPABASE_ANON_KEY` | Anon key for verifying user JWTs in admin-auth edge functions. Auto-provided. |
| `WEBHOOK_SECRET` | Optional alternative auth token for the webhook. If not set, the service role key is used. |

---

## 11. Testing

**File:** `supabase/functions/send-email/templates_test.ts`

The templates have unit tests written in Deno's built-in test runner. Each test instantiates a template function with sample data and asserts that the output HTML contains expected strings.

```typescript
Deno.test('enrollmentNotificationHtml includes parent name', () => {
  const html = enrollmentNotificationHtml(sampleLead, 'https://lbmaa.com/admin')
  assertStringIncludes(html, 'Jane Doe')
})
```

Tests cover:
- Parent name appears in the HTML
- Parent email appears
- Student name appears
- Admin URL appears in the CTA button
- Phone row is omitted when phone is `null`
- Sender name appears in messaging notification
- Portal URL appears in messaging notification

**How to run:**
```bash
deno test supabase/functions/send-email/templates_test.ts
```

The tests only cover template output — they do not test the actual Resend API call or the webhook flow.

---

## 12. What's Not Wired Yet

### Reminder emails

The `reminder` type exists in the schema, constraint, and template, but there is no automated trigger. To fully wire this up, you'd need:

- A scheduled job (e.g., a Supabase cron or an external cron service) that runs daily.
- The job would query `enrollment_leads` for rows where `status IN ('appointment_scheduled', 'appointment_confirmed')` and `appointment_date = CURRENT_DATE + 2`.
- For each matching lead, insert a `reminder` notification row.

The `send-email` function already handles the `reminder` type — only the scheduling piece is missing.

### Appointment confirmation via email link

The `confirm-appointment` edge function (`supabase/functions/confirm-appointment/index.ts`) exists and works: given a `booking_token`, it transitions the lead from `appointment_scheduled` to `appointment_confirmed`. The reminder email template already has a "Confirm My Attendance" button linking to `/confirm/{token}`.

What's missing is the frontend route at `/confirm/:token` that calls this function.

### SMS channel

The `channel` constraint allows `'sms'` in addition to `'email'`, reserving space for SMS notifications in the future. The `send-email` function only handles `'email'` today.

### Failed notification retry

If the Resend API call fails (network error, bad API key, etc.), the notification row is not updated to `'failed'` — it stays `'queued'`. There is no retry mechanism. A production hardening step would be to add a retry loop or move failed notifications to a dead-letter state for manual inspection.

---

## 13. Design Decisions

### Why not call Resend directly from the RPC / edge function that triggered the email?

Example: when `approve-enrollment-lead` runs, why not call `sendEmail()` right there instead of inserting a notification row?

Two reasons:
1. **Atomicity.** The lead status update and the intent to send an email should succeed or fail together. If they're in the same DB transaction, they do. If the Resend call happened inline, a Resend outage would block the entire approval action.
2. **Separation of concerns.** The approval function's job is to approve the lead. The email function's job is to send emails. Keeping them separate makes each piece easier to understand and test.

### Why is the `type` column on the notification row (not just inferred from lead status)?

The same lead can have notifications of different types at different points in time. When the `send-email` function sees a new notification row, it needs to know *which email* to send, not just *what state the lead is in*. For example, a lead in `approved` status could be receiving either an initial `approval` email or a resent one — the type column makes the intent explicit.

### Why not use a dedicated email queue service (SQS, etc.)?

The `enrollment_lead_notifications` table is a simple database-native queue. For the volume of emails this system handles (dozens to maybe hundreds per month), a full message queue would be significant added complexity with no benefit. The outbox pattern on a Postgres table is reliable enough and keeps the infrastructure minimal.

### Why does `bookingConfirmationHtml` include a rebooking link?

The booking confirmation email doubles as the prospect's "home base" for their appointment. If they need to reschedule, they have the link without needing to contact the academy or dig through old emails. This reduces admin burden and gives the prospect autonomy.

### Why does the reminder template have both a confirm link and a rebook link?

The confirm link (`/confirm/{token}`) lets the prospect tell the academy "yes, I'm still coming" without doing anything else. The rebook link (`/book/{token}`) lets them change the date if needed. Offering both in a single email handles the two most common pre-appointment actions.

---

## 14. Glossary

| Term | Meaning |
|---|---|
| **Outbox pattern** | Writing "send this email" to a database table, then processing it asynchronously, instead of calling the email API inline |
| **Webhook** | An HTTP request that fires automatically when something happens (e.g., a row is inserted) — you configure the URL, the platform calls it |
| **Edge Function** | A short-lived serverless function that runs on Deno, hosted by Supabase |
| **Resend** | The third-party email delivery service used to actually move emails from our server to recipients' inboxes |
| **Service role key** | A Supabase secret key that bypasses Row Level Security — only used in backend code, never in the browser |
| **Transactional email** | An automated email triggered by a specific user action (form submit, approval, etc.) as opposed to a marketing newsletter |
| **Inline styles** | CSS written directly on HTML elements as `style="..."` instead of in a stylesheet — required for reliable email rendering |
| **Fan-out** | Sending the same message to multiple recipients — used for `new_lead` notifications to all configured admins |
| **Foreign key** | A database column that references the primary key of another table, enforcing that the referenced row exists |
| **`ON DELETE CASCADE`** | A foreign key rule: when the parent row is deleted, all child rows that reference it are automatically deleted too |
