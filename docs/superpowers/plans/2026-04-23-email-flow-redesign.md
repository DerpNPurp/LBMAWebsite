# Email Flow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix missing appointment time in confirmation emails, send one confirmation email only after all programs are booked, and send one reminder per lead 2 days before their earliest appointment showing all appointments.

**Architecture:** Changes span three edge functions (`book-appointment`, `admin-book-appointment`, `send-email`) and one new SQL migration. A shared `getLeadAppointments` helper in `send-email` fetches all program bookings + children for a lead and returns formatted appointment data. Template functions get new array-based signatures. `recalculateLeadStatus` in both booking functions is updated to return a boolean so callers know whether to fire the notification.

**Tech Stack:** Deno/TypeScript edge functions, Supabase PostgREST, Resend email API, pg_cron

---

## File Map

| File | Change |
|------|--------|
| `supabase/functions/send-email/types.ts` | Add `AppointmentInfo` interface |
| `supabase/functions/send-email/templates.ts` | Update `bookingConfirmationHtml` and `reminderEmailHtml` signatures and bodies |
| `supabase/functions/send-email/templates.test.ts` | New — Deno unit tests for updated templates |
| `supabase/functions/send-email/index.ts` | Add `getLeadAppointments` helper; update `booking_confirmation` and `reminder` switch cases |
| `supabase/functions/book-appointment/index.ts` | `recalculateLeadStatus` returns `boolean`; gate notification on all-booked |
| `supabase/functions/admin-book-appointment/index.ts` | Same changes as `book-appointment` |
| `supabase/migrations/026_fix_reminder_cron.sql` | Replace reminder cron to use `enrollment_lead_program_bookings` |

---

### Task 1: Add AppointmentInfo type

**Files:**
- Modify: `supabase/functions/send-email/types.ts`

- [ ] **Step 1: Add AppointmentInfo interface**

Open `supabase/functions/send-email/types.ts`. Append after the last existing export:

```ts
export interface AppointmentInfo {
  programLabel: string
  childNames: string      // e.g. "Emma & Lily" — empty string if no children records
  date: string            // formatted, e.g. "Monday, April 28, 2026"
  time: string            // formatted, e.g. "4:00 PM"
  rebookingUrl: string    // ${appUrl}/book/${booking_token}
  bookingToken: string | null
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/send-email/types.ts
git commit -m "feat: add AppointmentInfo type for multi-appointment emails"
```

---

### Task 2: Update bookingConfirmationHtml template

**Files:**
- Modify: `supabase/functions/send-email/templates.ts`
- Create: `supabase/functions/send-email/templates.test.ts`

- [ ] **Step 1: Write failing tests**

Create `supabase/functions/send-email/templates.test.ts`:

```ts
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { bookingConfirmationHtml, reminderEmailHtml } from './templates.ts'
import type { AppointmentInfo } from './types.ts'

const single: AppointmentInfo[] = [
  {
    programLabel: 'Little Dragons',
    childNames: 'Emma',
    date: 'Monday, April 28, 2026',
    time: '4:00 PM',
    rebookingUrl: 'https://lbmaa.com/book/abc123',
    bookingToken: 'abc123',
  },
]

const multi: AppointmentInfo[] = [
  {
    programLabel: 'Little Dragons',
    childNames: 'Emma & Lily',
    date: 'Monday, April 28, 2026',
    time: '4:00 PM',
    rebookingUrl: 'https://lbmaa.com/book/abc123',
    bookingToken: 'abc123',
  },
  {
    programLabel: 'Youth Program',
    childNames: 'Jake',
    date: 'Wednesday, April 30, 2026',
    time: '5:30 PM',
    rebookingUrl: 'https://lbmaa.com/book/def456',
    bookingToken: 'def456',
  },
]

Deno.test('bookingConfirmationHtml — single: contains date, time, program, child, reschedule link', () => {
  const html = bookingConfirmationHtml('Eduardo Guerra', single)
  assertEquals(html.includes('Eduardo Guerra'), true)
  assertEquals(html.includes('Monday, April 28, 2026'), true)
  assertEquals(html.includes('4:00 PM'), true)
  assertEquals(html.includes('Little Dragons'), true)
  assertEquals(html.includes('Emma'), true)
  assertEquals(html.includes('https://lbmaa.com/book/abc123'), true)
})

Deno.test('bookingConfirmationHtml — multi: contains all programs, dates, times', () => {
  const html = bookingConfirmationHtml('Eduardo Guerra', multi)
  assertEquals(html.includes('Little Dragons'), true)
  assertEquals(html.includes('Youth Program'), true)
  assertEquals(html.includes('Monday, April 28, 2026'), true)
  assertEquals(html.includes('Wednesday, April 30, 2026'), true)
  assertEquals(html.includes('4:00 PM'), true)
  assertEquals(html.includes('5:30 PM'), true)
  assertEquals(html.includes('Jake'), true)
  assertEquals(html.includes('https://lbmaa.com/book/abc123'), true)
  assertEquals(html.includes('https://lbmaa.com/book/def456'), true)
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
deno test supabase/functions/send-email/templates.test.ts --filter "bookingConfirmationHtml"
```

Expected: compile/type error — old `bookingConfirmationHtml` signature takes `(lead: EnrollmentLead, rebookingUrl: string)` not `(string, AppointmentInfo[])`.

- [ ] **Step 3: Update bookingConfirmationHtml in templates.ts**

In `supabase/functions/send-email/templates.ts`:

1. Update the import at the top to include `AppointmentInfo`:

```ts
import type { EnrollmentLead, AppointmentInfo } from './types.ts'
```

2. Replace the existing `bookingConfirmationHtml` function (the one starting around line 117):

```ts
export function bookingConfirmationHtml(parentName: string, appointments: AppointmentInfo[]): string {
  const cards = appointments.map(a => `
    <div style="background:#f9f9f9;border:1px solid #e8e8e8;border-radius:6px;padding:14px 18px;margin:0 0 12px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#c8102e;margin-bottom:6px;">
        ${a.programLabel}${a.childNames ? ` — ${a.childNames}` : ''}
      </div>
      <div style="font-size:16px;font-weight:700;color:#1a1a2e;">${a.date}</div>
      <div style="font-size:13px;color:#555;margin-top:4px;">${a.time}</div>
      <p style="margin:10px 0 0;font-size:12px;color:#888;">
        Need to reschedule? <a href="${a.rebookingUrl}" style="color:#c8102e;text-decoration:none;">Click here</a>
      </p>
    </div>
  `).join('')

  const heading = appointments.length > 1 ? 'Appointments confirmed!' : 'Appointment confirmed!'
  const intro = appointments.length > 1 ? 'your enrollment appointments are set:' : 'your enrollment appointment is set:'

  return wrap(`
    <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1a1a2e;">${heading}</p>
    <p style="margin:0 0 16px;color:#555;font-size:13px;">Hi ${parentName}, ${intro}</p>
    ${cards}
  `)
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
deno test supabase/functions/send-email/templates.test.ts --filter "bookingConfirmationHtml"
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/send-email/templates.ts supabase/functions/send-email/templates.test.ts
git commit -m "feat: update bookingConfirmationHtml to accept multi-appointment array with times"
```

---

### Task 3: Update reminderEmailHtml template

**Files:**
- Modify: `supabase/functions/send-email/templates.ts`
- Modify: `supabase/functions/send-email/templates.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `supabase/functions/send-email/templates.test.ts` (use the `multi` fixture already defined at the top of the file):

```ts
Deno.test('reminderEmailHtml — contains all appointments, confirm button, reschedule links', () => {
  const html = reminderEmailHtml(
    'Eduardo Guerra',
    multi,
    'https://lbmaa.com/confirm/abc123'
  )
  assertEquals(html.includes('Eduardo Guerra'), true)
  assertEquals(html.includes('Little Dragons'), true)
  assertEquals(html.includes('Youth Program'), true)
  assertEquals(html.includes('Monday, April 28, 2026'), true)
  assertEquals(html.includes('Wednesday, April 30, 2026'), true)
  assertEquals(html.includes('4:00 PM'), true)
  assertEquals(html.includes('5:30 PM'), true)
  assertEquals(html.includes('https://lbmaa.com/confirm/abc123'), true)
  assertEquals(html.includes('Confirm My Attendance'), true)
  assertEquals(html.includes('https://lbmaa.com/book/abc123'), true)
  assertEquals(html.includes('https://lbmaa.com/book/def456'), true)
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
deno test supabase/functions/send-email/templates.test.ts --filter "reminderEmailHtml"
```

Expected: type error — old signature is `(lead: EnrollmentLead, confirmUrl: string, rebookingUrl: string)`.

- [ ] **Step 3: Update reminderEmailHtml in templates.ts**

Replace the existing `reminderEmailHtml` function (the one starting around line 139):

```ts
export function reminderEmailHtml(parentName: string, appointments: AppointmentInfo[], confirmUrl: string): string {
  const cards = appointments.map(a => `
    <div style="background:#f9f9f9;border:1px solid #e8e8e8;border-radius:6px;padding:14px 18px;margin:0 0 12px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#c8102e;margin-bottom:6px;">
        ${a.programLabel}${a.childNames ? ` — ${a.childNames}` : ''}
      </div>
      <div style="font-size:16px;font-weight:700;color:#1a1a2e;">${a.date}</div>
      <div style="font-size:13px;color:#555;margin-top:4px;">${a.time}</div>
      <p style="margin:10px 0 0;font-size:12px;color:#888;">
        Need to reschedule? <a href="${a.rebookingUrl}" style="color:#c8102e;text-decoration:none;">Click here</a>
      </p>
    </div>
  `).join('')

  const heading = appointments.length > 1
    ? 'Reminder: your LBMAA appointments are in 2 days'
    : 'Reminder: your LBMAA appointment is in 2 days'
  const intro = appointments.length > 1
    ? 'just a reminder — your intro appointments are coming up:'
    : 'just a reminder — your intro appointment is coming up:'

  return wrap(`
    <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1a1a2e;">${heading}</p>
    <p style="margin:0 0 16px;color:#555;font-size:13px;">Hi ${parentName}, ${intro}</p>
    ${cards}
    ${ctaButton(confirmUrl, 'Confirm My Attendance')}
  `)
}
```

- [ ] **Step 4: Run all template tests**

```bash
deno test supabase/functions/send-email/templates.test.ts
```

Expected: all 3 tests pass (2 `bookingConfirmationHtml` + 1 `reminderEmailHtml`).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/send-email/templates.ts supabase/functions/send-email/templates.test.ts
git commit -m "feat: update reminderEmailHtml to accept multi-appointment array"
```

---

### Task 4: Add getLeadAppointments helper to send-email

**Files:**
- Modify: `supabase/functions/send-email/index.ts`

- [ ] **Step 1: Update the import line in index.ts**

Find the import from `./types.ts` at the top of `supabase/functions/send-email/index.ts`. Add `AppointmentInfo` to it:

```ts
import type { WebhookPayload, EnrollmentLeadNotificationRecord, MessageRecord, EnrollmentLead, PortalEmailQueueRecord, AppointmentInfo } from './types.ts'
```

- [ ] **Step 2: Verify PROGRAM_LABELS constant exists**

Confirm `PROGRAM_LABELS` is defined near the top of `index.ts`:

```ts
const PROGRAM_LABELS: Record<string, string> = {
  little_dragons: 'Little Dragons',
  youth: 'Youth Program',
}
```

If it's missing, add it after the imports.

- [ ] **Step 3: Add getLeadAppointments after the adminClient function**

In `supabase/functions/send-email/index.ts`, add this function after `adminClient()` and before `handleEnrollmentNotification`:

```ts
async function getLeadAppointments(
  supabase: ReturnType<typeof adminClient>,
  leadId: string,
  appUrl: string
): Promise<AppointmentInfo[]> {
  const { data: bookings } = await supabase
    .from('enrollment_lead_program_bookings')
    .select('program_type, booking_token, appointment_date, appointment_time')
    .eq('lead_id', leadId)
    .not('appointment_date', 'is', null)
    .order('appointment_date', { ascending: true })

  if (!bookings || bookings.length === 0) return []

  return Promise.all(
    bookings.map(async (b: {
      program_type: string
      booking_token: string | null
      appointment_date: string
      appointment_time: string
    }) => {
      const { data: children } = await supabase
        .from('enrollment_lead_children')
        .select('name')
        .eq('lead_id', leadId)
        .eq('program_type', b.program_type)

      const childNames = children?.map((c: { name: string }) => c.name).join(' & ') ?? ''
      const date = new Date(b.appointment_date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      })
      const time = new Date('1970-01-01T' + b.appointment_time).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
      })

      return {
        programLabel: PROGRAM_LABELS[b.program_type] ?? b.program_type,
        childNames,
        date,
        time,
        rebookingUrl: b.booking_token ? `${appUrl}/book/${b.booking_token}` : appUrl,
        bookingToken: b.booking_token,
      }
    })
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/send-email/index.ts
git commit -m "feat: add getLeadAppointments helper to send-email"
```

---

### Task 5: Update booking_confirmation handler

**Files:**
- Modify: `supabase/functions/send-email/index.ts`

- [ ] **Step 1: Replace the booking_confirmation case**

In `supabase/functions/send-email/index.ts`, inside `handleEnrollmentNotification`, find:

```ts
    case 'booking_confirmation':
      subject = `Appointment confirmed — LBMAA`
      html = bookingConfirmationHtml(lead, bookingUrl)
      break
```

Replace with:

```ts
    case 'booking_confirmation': {
      const appointments = await getLeadAppointments(supabase, record.lead_id, appUrl)
      subject = appointments.length > 1 ? 'Appointments confirmed — LBMAA' : 'Appointment confirmed — LBMAA'
      html = bookingConfirmationHtml(lead.parent_name, appointments)
      break
    }
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/send-email/index.ts
git commit -m "feat: booking_confirmation email now shows all appointments with times"
```

---

### Task 6: Update reminder handler

**Files:**
- Modify: `supabase/functions/send-email/index.ts`

- [ ] **Step 1: Replace the reminder case**

In `supabase/functions/send-email/index.ts`, inside `handleEnrollmentNotification`, find:

```ts
    case 'reminder':
      subject = `Reminder: your LBMAA appointment in 2 days`
      html = reminderEmailHtml(lead, confirmUrl, bookingUrl)
      break
```

Replace with:

```ts
    case 'reminder': {
      const appointments = await getLeadAppointments(supabase, record.lead_id, appUrl)
      // Derive confirm URL from the earliest booking's token (appointments are sorted ASC by date)
      const firstToken = appointments[0]?.bookingToken ?? lead.booking_token
      const reminderConfirmUrl = firstToken ? `${appUrl}/confirm/${firstToken}` : appUrl
      subject = appointments.length > 1
        ? 'Reminder: your LBMAA appointments are in 2 days'
        : 'Reminder: your LBMAA appointment is in 2 days'
      html = reminderEmailHtml(lead.parent_name, appointments, reminderConfirmUrl)
      break
    }
```

- [ ] **Step 2: Verify confirmUrl and bookingUrl are still used elsewhere**

The variables `confirmUrl` and `bookingUrl` are computed at the top of `handleEnrollmentNotification` and still used by `approval` and other cases. Do not remove them.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/send-email/index.ts
git commit -m "feat: reminder email now shows all appointments, confirm URL from earliest booking"
```

---

### Task 7: Update book-appointment edge function

**Files:**
- Modify: `supabase/functions/book-appointment/index.ts`

- [ ] **Step 1: Update recalculateLeadStatus to return boolean**

In `supabase/functions/book-appointment/index.ts`, replace the existing `recalculateLeadStatus` function with this version that returns whether all bookings are now scheduled or confirmed:

```ts
async function recalculateLeadStatus(
  supabase: ReturnType<typeof adminClient>,
  leadId: string
): Promise<boolean> {
  const { data: bookings } = await supabase
    .from('enrollment_lead_program_bookings')
    .select('status')
    .eq('lead_id', leadId)

  if (!bookings || bookings.length === 0) return false

  const statuses = bookings.map((b: { status: string }) => b.status)
  const allScheduledOrConfirmed = statuses.every((s: string) => s === 'scheduled' || s === 'confirmed')
  const allConfirmed = statuses.every((s: string) => s === 'confirmed')

  const leadStatus = allConfirmed
    ? 'appointment_confirmed'
    : allScheduledOrConfirmed
    ? 'appointment_scheduled'
    : 'approved'

  await supabase
    .from('enrollment_leads')
    .update({ status: leadStatus })
    .eq('lead_id', leadId)

  return allScheduledOrConfirmed
}
```

- [ ] **Step 2: Gate the notification on the return value**

Find the block after `await recalculateLeadStatus(supabase, lead.lead_id)`. Replace:

```ts
  await recalculateLeadStatus(supabase, lead.lead_id)

  const { error: notifError } = await supabase
    .from('enrollment_lead_notifications')
    .insert({
      lead_id: lead.lead_id,
      recipient_email: lead.parent_email,
      channel: 'email',
      type: 'booking_confirmation',
      status: 'queued',
    })

  if (notifError) {
    console.error('[book-appointment] notification insert error:', notifError)
    return new Response('Booking saved but notification failed', { status: 500, headers: CORS_HEADERS })
  }
```

With:

```ts
  const allBooked = await recalculateLeadStatus(supabase, lead.lead_id)

  if (allBooked) {
    const { error: notifError } = await supabase
      .from('enrollment_lead_notifications')
      .insert({
        lead_id: lead.lead_id,
        recipient_email: lead.parent_email,
        channel: 'email',
        type: 'booking_confirmation',
        status: 'queued',
      })

    if (notifError) {
      console.error('[book-appointment] notification insert error:', notifError)
      return new Response('Booking saved but notification failed', { status: 500, headers: CORS_HEADERS })
    }
  }
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/book-appointment/index.ts
git commit -m "feat: only send booking_confirmation after all programs are booked (public path)"
```

---

### Task 8: Update admin-book-appointment edge function

**Files:**
- Modify: `supabase/functions/admin-book-appointment/index.ts`

- [ ] **Step 1: Update recalculateLeadStatus to return boolean**

In `supabase/functions/admin-book-appointment/index.ts`, replace the existing `recalculateLeadStatus` with the same updated version:

```ts
async function recalculateLeadStatus(
  supabase: ReturnType<typeof adminClient>,
  leadId: string
): Promise<boolean> {
  const { data: bookings } = await supabase
    .from('enrollment_lead_program_bookings')
    .select('status')
    .eq('lead_id', leadId)

  if (!bookings || bookings.length === 0) return false

  const statuses = bookings.map((b: { status: string }) => b.status)
  const allScheduledOrConfirmed = statuses.every((s: string) => s === 'scheduled' || s === 'confirmed')
  const allConfirmed = statuses.every((s: string) => s === 'confirmed')

  const leadStatus = allConfirmed
    ? 'appointment_confirmed'
    : allScheduledOrConfirmed
    ? 'appointment_scheduled'
    : 'approved'

  await supabase
    .from('enrollment_leads')
    .update({ status: leadStatus })
    .eq('lead_id', leadId)

  return allScheduledOrConfirmed
}
```

- [ ] **Step 2: Gate the notification on the return value**

Find the block after `await recalculateLeadStatus(supabase, lead.lead_id)`. Replace:

```ts
  await recalculateLeadStatus(supabase, lead.lead_id)

  const { error: notifError } = await supabase
    .from('enrollment_lead_notifications')
    .insert({
      lead_id: lead.lead_id,
      recipient_email: lead.parent_email,
      channel: 'email',
      type: 'booking_confirmation',
      status: 'queued',
    })

  if (notifError) {
    console.error('[admin-book-appointment] notification insert error:', notifError)
    return new Response('Booking saved but notification failed', { status: 500, headers: CORS_HEADERS })
  }
```

With:

```ts
  const allBooked = await recalculateLeadStatus(supabase, lead.lead_id)

  if (allBooked) {
    const { error: notifError } = await supabase
      .from('enrollment_lead_notifications')
      .insert({
        lead_id: lead.lead_id,
        recipient_email: lead.parent_email,
        channel: 'email',
        type: 'booking_confirmation',
        status: 'queued',
      })

    if (notifError) {
      console.error('[admin-book-appointment] notification insert error:', notifError)
      return new Response('Booking saved but notification failed', { status: 500, headers: CORS_HEADERS })
    }
  }
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/admin-book-appointment/index.ts
git commit -m "feat: only send booking_confirmation after all programs are booked (admin path)"
```

---

### Task 9: Replace reminder cron job via migration

**Files:**
- Create: `supabase/migrations/026_fix_reminder_cron.sql`

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/026_fix_reminder_cron.sql` with this content:

```sql
-- Replace appointment-reminders cron to use enrollment_lead_program_bookings.
-- Sends one reminder per lead, 2 days before their earliest appointment.
-- Guards against duplicate sends via NOT EXISTS on prior reminder notifications.

DO $$ BEGIN
  PERFORM cron.unschedule('appointment-reminders');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'appointment-reminders',
  '0 8 * * *',
  $$
  INSERT INTO enrollment_lead_notifications (lead_id, recipient_email, channel, type, status)
  SELECT el.lead_id, el.parent_email, 'email', 'reminder', 'queued'
  FROM enrollment_leads el
  WHERE el.deleted_at IS NULL
    AND el.status IN ('appointment_scheduled', 'appointment_confirmed')
    AND (
      SELECT MIN(elpb.appointment_date)
      FROM enrollment_lead_program_bookings elpb
      WHERE elpb.lead_id = el.lead_id
        AND elpb.appointment_date IS NOT NULL
    ) = (CURRENT_DATE + INTERVAL '2 days')::date
    AND NOT EXISTS (
      SELECT 1 FROM enrollment_lead_notifications eln
      WHERE eln.lead_id = el.lead_id AND eln.type = 'reminder'
    );
  $$
);
```

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP tool (`mcp__supabase__apply_migration`) with the SQL above, or paste it into the Supabase SQL editor for your linked project.

- [ ] **Step 3: Verify the cron job was updated**

Run in the Supabase SQL editor:

```sql
SELECT jobname, schedule, command
FROM cron.job
WHERE jobname = 'appointment-reminders';
```

Expected: one row with `schedule = '0 8 * * *'` and the command body referencing `enrollment_lead_program_bookings`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/026_fix_reminder_cron.sql
git commit -m "feat: replace reminder cron — one email per lead, 2 days before first appointment"
```

---

### Task 10: Deploy edge functions and smoke test

- [ ] **Step 1: Deploy all three updated functions**

```bash
supabase functions deploy send-email
supabase functions deploy book-appointment
supabase functions deploy admin-book-appointment
```

If the Supabase CLI is not installed, run each deploy via the Supabase dashboard → Edge Functions → deploy from local.

- [ ] **Step 2: Smoke test — single-program lead**

1. Create a test lead in the admin portal with **one** program and one child
2. Approve it (booking link sent)
3. Use the booking link to pick an appointment
4. Check the parent's inbox — confirm the email:
   - Subject contains "Appointment confirmed"
   - Shows the program name and child name
   - Shows the **date AND time** (this was the original bug)
   - Contains a reschedule link

- [ ] **Step 3: Smoke test — multi-program lead**

1. Create a test lead with **two** programs (e.g., Little Dragons + Youth), each with at least one child
2. Approve it (two booking links sent)
3. Book **only the first program** → confirm no email arrives yet
4. Book the **second program** → confirm one email arrives listing **both** appointments with dates, times, children, and reschedule links per program
5. Subject should read "Appointments confirmed — LBMAA"

- [ ] **Step 4: Commit any fixes found during smoke test**

```bash
git add -A
git commit -m "fix: smoke test corrections"
```
