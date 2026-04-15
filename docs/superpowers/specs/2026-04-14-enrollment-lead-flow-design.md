# Enrollment Lead Flow — Full Design Spec

**Date:** 2026-04-14  
**Status:** Approved  
**Scope:** Extends the existing enrollment lead capture system with approval/denial flows, in-app booking, appointment confirmation, email reminders, admin availability management, and manual enrollment entry.

---

## 1. Overview

Anonymous users submit enrollment inquiries via the public contact form. Admins review leads and either approve (sending a booking link) or deny (sending a templated message). Approved prospects book an appointment via a public `/book/:token` page. A 2-day-before reminder email includes a one-click confirmation link. Admins can also manually create leads and optionally book appointments on the prospect's behalf.

---

## 2. Out of Scope (Deferred)

- SMS reminders via Twilio — deferred; email reminder replaces it for now
- Inbound SMS "reply YES" confirmation — deferred with SMS

---

## 3. Database Schema Changes

### 3a. `enrollment_leads` — new columns

| Column | Type | Notes |
|---|---|---|
| `booking_token` | UUID | Generated at approval. Used for `/book/:token` and `/confirm/:token`. Never regenerated — resending just resends the same link. |
| `appointment_date` | DATE | Set when prospect (or admin) books a slot. |
| `appointment_time` | TIME | Set alongside `appointment_date`. |
| `denied_at` | TIMESTAMPTZ | Set when admin sends denial. |
| `denial_message` | TEXT | The message sent to the prospect on denial. |

### `status` column — extended values

Current: `new | approved | appointment_scheduled | enrolled | closed`  
Add: `appointment_confirmed | denied`

Full set: `new | approved | appointment_scheduled | appointment_confirmed | denied | enrolled | closed`

### 3b. New table: `appointment_slots`

Defines the recurring weekly availability schedule.

| Column | Type | Notes |
|---|---|---|
| `slot_id` | UUID PK | |
| `day_of_week` | INTEGER | 0=Sun, 1=Mon … 6=Sat |
| `start_time` | TIME | e.g. `16:00` |
| `end_time` | TIME | e.g. `18:00` |
| `label` | TEXT | e.g. "Wednesday 4–6pm" |
| `is_active` | BOOLEAN | Soft disable without deleting |
| `created_at` | TIMESTAMPTZ | |

Group appointments — no per-slot capacity limit. Multiple prospects can book the same slot on the same date.

### 3c. New table: `appointment_slot_overrides`

Blocks a specific date from being bookable for a given slot.

| Column | Type | Notes |
|---|---|---|
| `override_id` | UUID PK | |
| `slot_id` | UUID FK → appointment_slots | |
| `override_date` | DATE | The specific date to block |
| `reason` | TEXT nullable | Optional admin note |
| `created_at` | TIMESTAMPTZ | |

### 3d. New table: `admin_notification_settings`

Replaces the hardcoded `app.lbmaa_faculty_notification_email` Postgres config setting.

| Column | Type | Notes |
|---|---|---|
| `setting_id` | UUID PK | |
| `email` | TEXT | Recipient email |
| `notify_new_leads` | BOOLEAN DEFAULT true | Toggle per recipient |
| `is_active` | BOOLEAN DEFAULT true | Soft disable |
| `created_at` | TIMESTAMPTZ | |

RLS: admins can read/write. No public access.

### 3e. `enrollment_lead_notifications` — extended

Add `type` column (TEXT) with values:
- `new_lead` — admin notification on new submission
- `approval` — booking link email to prospect
- `denial` — denial message email to prospect
- `booking_confirmation` — appointment booked confirmation to prospect
- `reminder` — 2-day reminder with confirm link to prospect

Extend `channel` constraint to include `'sms'` for future Twilio support (no-op for now).

---

## 4. API & Edge Function Layer

### 4a. Extended: `send-email` edge function

Triggered by `enrollment_lead_notifications` INSERT webhook. New handlers added per `type`:

| type | Recipient | Subject | Content |
|---|---|---|---|
| `new_lead` | All active `admin_notification_settings` recipients | "New enrollment inquiry — [name]" | Lead details + admin portal link |
| `approval` | `lead.parent_email` | "Your enrollment request — book your appointment" | Booking link `/book/:token`, LBMAA branding |
| `denial` | `lead.parent_email` | "Your enrollment request at LBMAA" | `lead.denial_message` |
| `booking_confirmation` | `lead.parent_email` | "Appointment confirmed — [date]" | Date/time, rebooking link `/book/:token`, LBMAA contact info |
| `reminder` | `lead.parent_email` | "Reminder: your LBMAA appointment on [date]" | Date/time, confirm link `/confirm/:token`, rebooking link `/book/:token` |

All emails follow the existing Resend + branded template pattern in `send-email/templates.ts`.

### 4b. New: `approve-enrollment-lead` edge function

**Trigger:** Admin clicks "Approve & Send Invite" on a `new` lead.  
**Auth:** Supabase user session (admin only).

Steps:
1. Verify calling user is admin
2. Generate `booking_token` UUID
3. Update lead: `status → approved`, set `booking_token`, set `approved_at`
4. Insert notification row `type='approval'` → triggers `send-email`

### 4c. New: `deny-enrollment-lead` edge function

**Trigger:** Admin submits denial modal.  
**Auth:** Supabase user session (admin only).  
**Payload:** `{ leadId, message }`

Steps:
1. Verify calling user is admin
2. Update lead: `status → denied`, set `denial_message`, set `denied_at`
3. Insert notification row `type='denial'` → triggers `send-email`

### 4d. New: `resend-booking-link` edge function

**Trigger:** Admin clicks "Resend Booking Link".  
**Auth:** Supabase user session (admin only).  
**Payload:** `{ leadId }`

Steps:
1. Verify calling user is admin
2. Confirm lead has a `booking_token` (must be `approved`, `appointment_scheduled`, or `appointment_confirmed`)
3. Insert notification row `type='approval'` — reuses existing token, no regeneration

### 4e. New: `book-appointment` edge function

**Trigger:** Prospect submits date selection on `/book/:token`.  
**Auth:** `booking_token` only — no Supabase session required.  
**Payload:** `{ token, slotId, appointmentDate }`

Steps:
1. Look up lead by `booking_token` — 404 if not found
2. Confirm lead status is `approved`, `appointment_scheduled`, or `appointment_confirmed` — rejects if `denied` or `closed`
3. Confirm slot exists, is active, and `appointmentDate` is not in `appointment_slot_overrides`
4. Derive `appointment_time` from the slot's `start_time`
5. Update lead: `appointment_date`, `appointment_time`
6. If `appointmentDate - today < 2 days`:
   - Set `status → appointment_confirmed`
   - Insert notification row `type='booking_confirmation'` (no reminder needed)
7. Else:
   - Set `status → appointment_scheduled`
   - Insert notification row `type='booking_confirmation'`
8. Return appointment details to client

### 4f. New: `confirm-appointment` edge function

**Trigger:** Prospect clicks "Confirm attendance" in reminder email → `/confirm/:token`.  
**Auth:** `booking_token` only.  
**Payload:** `{ token }`

Steps:
1. Look up lead by `booking_token` — 404 if not found
2. If status is `appointment_confirmed` → return already-confirmed response (idempotent)
3. If status is not `appointment_scheduled` → return error
4. Update lead: `status → appointment_confirmed`
5. Return success with appointment details

### 4g. New: `admin-book-appointment` edge function

**Trigger:** Admin submits "Pick Date" or "Pick date for them" modal.  
**Auth:** Supabase user session (admin only).  
**Payload:** `{ leadId, slotId, appointmentDate }`

Steps:
1. Verify calling user is admin
2. Ensure lead has a `booking_token` — generate one if missing (e.g. for manually created leads that skipped the approval email)
3. Follow same booking logic as `book-appointment` (4e), steps 3–8
4. Additionally sends `booking_confirmation` notification to prospect

### 4h. New: Nightly reminder cron (pg_cron)

A Postgres function scheduled via `pg_cron` to run nightly at e.g. 8:00am.

Finds all leads where:
- `status = 'appointment_scheduled'`
- `appointment_date = CURRENT_DATE + 2`
- No existing `reminder` notification row exists for this lead

For each match: inserts notification row `type='reminder'` → triggers `send-email`.

### 4i. New RPCs (admin UI calls)

| RPC | Purpose |
|---|---|
| `get_available_slots(target_date DATE)` | Returns active slots not blocked by overrides on that date |
| `get_upcoming_bookable_dates(slot_id UUID, weeks_ahead INT DEFAULT 8)` | Returns next N available dates for a slot (excludes overridden dates). Default 8 weeks. |
| `create_enrollment_lead(...)` | Admin manual lead creation. All fields. `source_page = 'admin'`. Returns `lead_id`. |
| `get_admin_notification_settings()` | Returns all active notification recipients |
| `upsert_admin_notification_setting(email, notify_new_leads)` | Add or update a recipient |
| `delete_admin_notification_setting(setting_id)` | Remove a recipient |
| `upsert_appointment_slot(...)` | Add or update a recurring slot |
| `delete_appointment_slot(slot_id)` | Soft-delete (sets `is_active = false`) |
| `add_slot_override(slot_id, override_date, reason)` | Block a specific date |
| `remove_slot_override(override_id)` | Unblock a date |

---

## 5. Frontend Routes & Components

### 5a. New public routes

| Route | Component | Auth |
|---|---|---|
| `/book/:token` | `BookingPage` | None — token is auth |
| `/confirm/:token` | `ConfirmPage` | None — token is auth |

Both routes added to `App.tsx` outside `ProtectedRoute`.

### 5b. Updated: `AdminEnrollmentLeadsTab`

**Status badges** — full set with colors:

| Status | Style |
|---|---|
| `new` | Blue |
| `approved` | Amber |
| `appointment_scheduled` | Purple |
| `appointment_confirmed` | Green |
| `denied` | Red |
| `enrolled` | Emerald |
| `closed` | Gray |

**Action buttons per status:**

| Status | Primary (filled) | Secondary (outlined/ghost) |
|---|---|---|
| `new` | Approve & Send Invite | Deny (outlined, destructive color) |
| `approved` | — | Resend Booking Link, Pick Date for Them, Deny |
| `appointment_scheduled` | — | Resend Booking Link, Pick New Date |
| `appointment_confirmed` | — | Resend Booking Link, Pick New Date |
| `denied` | — | Status dropdown to reopen |

Appointment date/time shown on card for `appointment_scheduled` and `appointment_confirmed`.

**"+ New Lead" button** in tab header → opens `NewLeadModal`.

### 5c. New component: `DenyModal`

- Textarea with visible label "Message to applicant" — pre-filled default template
- Character count shown below
- "Send Denial" → `variant="destructive"` (filled red) — single primary CTA
- "Cancel" → `variant="ghost"`
- If message edited and Cancel clicked → inline "Discard changes?" prompt before closing

### 5d. New component: `PickDateModal`

- Slot selector (hidden if only one active slot)
- Scrollable list of upcoming available dates — card per date, min 56px height
- Selected card: `ring-2 ring-primary`
- Amber inline badge when date is within 2 days: "Will be auto-confirmed"
- "Confirm Appointment" button — disabled until date selected, loading on submit
- Success toast on completion: "Appointment booked for [date]"

### 5e. New component: `NewLeadModal`

- Fields: Parent name*, email*, phone, Student name, age, Notes
- All inputs have visible labels — no placeholder-only labels
- Required fields marked with asterisk
- Segmented control at bottom: "Send Booking Link" | "Pick Date for Them"
  - "Pick Date for Them" selected → `PickDateModal` slot/date UI renders inline
- Primary CTA label adapts: "Create & Send Link" / "Create & Book" / "Create Lead"
- Validates on blur, not keystroke

### 5f. New component: `AdminAvailabilitySettings`

New section in admin settings area. Two cards:

**Appointment Availability**
- Recurring slots list: day + time range, Edit + Delete per row (min 44px touch targets)
- "+ Add Slot" → inline form row: day-of-week select + start time + end time + Save
- Blocked Dates list: date + reason + Remove button
- "+ Block Date" → date picker + reason input + Add button

**Email Notification Recipients**
- Recipient rows: email + "New leads" toggle + Remove button
- "+ Add Recipient" → email input + Add button
- Empty state: "No notification recipients configured."

### 5g. New page: `BookingPage` (`/book/:token`)

Public, no auth. Three states:

**State: `approved` (first-time booking)**
- LBMAA logo, Lexend heading "Book your enrollment appointment"
- "Hi [parent_name]! Select a date below."
- Vertical list of date cards — each: weekday + full date + time range, min 56px, 8px gap
- "Confirm Booking" — full-width mobile, centered desktop — disabled until selected
- On success: inline confirmation screen, no reload — "Booked for [date]. A confirmation email has been sent to [email]. Need to reschedule? [link]"

**State: `appointment_scheduled` / `appointment_confirmed` (rebooking)**
- "You're booked for [date] at [time]"
- `appointment_confirmed` → "Your attendance is confirmed" green badge
- "Need to reschedule?" link → reveals date picker

**State: invalid token / `denied` / `closed`**
- "This booking link is no longer valid. Please contact LBMAA directly."

### 5h. New page: `ConfirmPage` (`/confirm/:token`)

Single-purpose. States:

**Success**
- SVG checkmark icon (not emoji)
- "You're confirmed!" (Lexend heading)
- Appointment date/time card
- "See you then! — LBMAA Team" + address/contact

**Already confirmed**
- "You've already confirmed your attendance — see you on [date]!"

**Invalid**
- "This link is no longer valid. Please contact LBMAA directly."

---

## 6. Email Templates (additions to `templates.ts`)

| Template function | Used for |
|---|---|
| `approvalEmailHtml(lead, bookingUrl)` | Approval — booking link |
| `denialEmailHtml(lead)` | Denial — uses `lead.denial_message` |
| `bookingConfirmationHtml(lead, rebookingUrl)` | Post-booking confirmation |
| `reminderEmailHtml(lead, confirmUrl, rebookingUrl)` | 2-day reminder |

All templates follow existing branded style: `FROM = 'Los Banos Martial Arts Academy <no-reply@notifications.lbmartialarts.com>'`

Booking confirmation and reminder emails both include a footer rebooking line:  
*"Need to reschedule? [Click here]"* → `/book/:token`

---

## 7. Status Transition Map

```
new
 ├── [admin approve]        → approved
 └── [admin deny]           → denied

approved
 ├── [prospect books]       → appointment_scheduled
 │    └── [if < 2 days]     → appointment_confirmed (skip reminder)
 ├── [admin books for them] → appointment_scheduled / appointment_confirmed
 └── [admin deny]           → denied

appointment_scheduled
 ├── [prospect confirms]    → appointment_confirmed
 ├── [prospect/admin rebooks] → appointment_scheduled (reset, new confirmation email)
 └── [admin manual]         → any status via dropdown

appointment_confirmed
 ├── [prospect/admin rebooks] → appointment_scheduled (reset)
 └── [admin manual]         → enrolled / closed

denied
 └── [admin manual]         → new (reopen)
```

---

## 8. Edge Cases

| Scenario | Behavior |
|---|---|
| Prospect visits `/book/:token` after booking | Shows current booking + reschedule option |
| Prospect rebooks after being `appointment_confirmed` | Status resets to `appointment_scheduled`, new confirmation email sent |
| Admin books a date within 2 days | Status goes directly to `appointment_confirmed`, no reminder sent |
| Prospect books a date within 2 days | Same — auto-confirms at booking time |
| Reminder cron runs for already-confirmed lead | No-op — cron only targets `appointment_scheduled` |
| Duplicate reminder (cron runs twice) | Idempotent — checks for existing `reminder` notification row |
| `approve-enrollment-lead` called on already-approved lead | No-op or re-send — safe to call multiple times |
| Invalid/expired token on `/confirm/:token` | Returns "link no longer valid" message |

---

## 9. TypeScript Type Updates (`src/lib/types.ts`)

`EnrollmentLead.status` extended:
```ts
status: 'new' | 'approved' | 'appointment_scheduled' | 'appointment_confirmed' | 'denied' | 'enrolled' | 'closed'
```

New fields on `EnrollmentLead`:
```ts
booking_token: string | null
appointment_date: string | null   // "YYYY-MM-DD"
appointment_time: string | null   // "HH:MM:SS"
denied_at: string | null
denial_message: string | null
```

New types:
```ts
export type AppointmentSlot = {
  slot_id: string
  day_of_week: number
  start_time: string
  end_time: string
  label: string
  is_active: boolean
  created_at: string
}

export type AppointmentSlotOverride = {
  override_id: string
  slot_id: string
  override_date: string
  reason: string | null
  created_at: string
}

export type AdminNotificationSetting = {
  setting_id: string
  email: string
  notify_new_leads: boolean
  is_active: boolean
  created_at: string
}
```
