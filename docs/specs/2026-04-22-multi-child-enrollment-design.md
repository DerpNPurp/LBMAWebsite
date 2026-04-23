# Multi-Child Enrollment Form + Per-Program Appointment Booking

**Date:** 2026-04-22  
**Status:** Approved for implementation

---

## Overview

Replace the single-child enrollment form with a multi-child form. Siblings in the same program share one appointment slot — one booking link, one visit. A family with 3 kids (1 Little Dragons, 2 Youth) receives 2 booking links and schedules 2 appointments, not 3.

Two programs:
- **Little Dragons** — ages 4–7
- **Youth Program** — ages 8–17

Ages outside 4–17 are not accepted by the form. Program type is derived server-side from age; it is never sent by the client.

---

## 1. Public Enrollment Form (`ContactPage`)

### Layout
Compact inline rows replace the single `studentName`/`studentAge` fields:

```
[ Child's name          ] [ Age ] [×]
[ Child's name          ] [ Age ] [×]
                        [+ Add another child]
```

- Minimum one row, always present. The × remove button only renders when 2+ rows exist.
- `+ Add another child` is a text/ghost button below the last row.
- Age input: `type="number"` min=4 max=17.
- A read-only program label auto-renders below the age field once age is entered:
  - 4–7 → purple `Little Dragons · ages 4–7`
  - 8–17 → blue `Youth Program · ages 8–17`

### Validation (client + server)
- Each child row requires both name and age.
- Age must be 4–17 inclusive. Any age outside this range blocks form submission with: *"We currently enroll ages 4–17. Please contact us directly for other inquiries."*
- Parent name and email remain required; phone remains optional.
- Single optional notes `Textarea` at the bottom (family-level, unchanged).

### Submit payload
```ts
{
  parentName: string
  parentEmail: string
  phone?: string
  message?: string
  children: Array<{ name: string; age: number }>
}
```

`program_type` is derived server-side; clients never send it.

---

## 2. Database Schema

### New table: `enrollment_lead_children`

Stores child identity only — no booking fields.

```sql
CREATE TABLE public.enrollment_lead_children (
  child_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id       UUID NOT NULL REFERENCES public.enrollment_leads(lead_id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  age           INTEGER NOT NULL,
  program_type  TEXT NOT NULL CHECK (program_type IN ('little_dragons', 'youth')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT children_age_range CHECK (age >= 4 AND age <= 17)
);
```

### New table: `enrollment_lead_program_bookings`

One row per `(lead_id, program_type)` pair. Siblings sharing a program share this row.

```sql
CREATE TABLE public.enrollment_lead_program_bookings (
  booking_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id             UUID NOT NULL REFERENCES public.enrollment_leads(lead_id) ON DELETE CASCADE,
  program_type        TEXT NOT NULL CHECK (program_type IN ('little_dragons', 'youth')),
  booking_token       UUID UNIQUE,              -- generated on approval
  appointment_slot_id UUID REFERENCES public.appointment_slots(slot_id),
  appointment_date    DATE,
  appointment_time    TIME,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'link_sent', 'scheduled', 'confirmed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lead_id, program_type)                -- one booking per program per family
);
```

RLS: admins can SELECT/UPDATE; anon/authenticated cannot read directly (token-based access via edge functions only).

### `appointment_slots` — add program_type

```sql
ALTER TABLE public.appointment_slots
  ADD COLUMN program_type TEXT NOT NULL DEFAULT 'all'
    CHECK (program_type IN ('little_dragons', 'youth', 'all'));
```

Existing slots default to `'all'` and remain bookable by either program until re-tagged.

### Booked-date exclusion

`get_upcoming_bookable_dates(slot_id)` is updated to exclude any `(slot_id, appointment_date)` pair where a row in `enrollment_lead_program_bookings` has `status IN ('scheduled', 'confirmed')`. One booking per slot occurrence, regardless of program type.

### `submit_enrollment_lead` RPC

Updated signature:
```sql
CREATE OR REPLACE FUNCTION public.submit_enrollment_lead(
  p_parent_name   TEXT,
  p_parent_email  TEXT,
  p_phone         TEXT DEFAULT NULL,
  p_message       TEXT DEFAULT NULL,
  p_source_page   TEXT DEFAULT 'contact',
  p_children      JSONB DEFAULT NULL   -- [{name, age}, ...]
)
```

After inserting the lead row:
1. Iterates `p_children`, inserts one `enrollment_lead_children` row per child with `program_type` derived from age.
2. Inserts one `enrollment_lead_program_bookings` row per distinct `program_type` found in the children list (status = `pending`).

Old `p_student_name`/`p_student_age` parameters are removed from the public-facing call; the columns remain on `enrollment_leads` for backward-compatible reads of legacy leads.

### Backward compatibility

`enrollment_leads.student_name` and `enrollment_leads.student_age` columns are kept. New leads write no value to them. The admin UI renders a legacy fallback row (`[legacy] {student_name} · age {student_age}`) for leads with no child rows.

---

## 3. Admin Enrollment Lead Card

### Children section

Children are displayed **grouped by program type**, with the booking status shown once per group:

```
[Little Dragons]  📅 Sat Jan 11 · 10:00 AM
  Alex · age 6

[Youth Program]   link sent · not booked yet
  Jordan · age 15
  Sam · age 12
```

Per-program booking status display:
| `status`    | Display |
|-------------|---------|
| `pending`   | awaiting approval |
| `link_sent` | link sent · not booked yet |
| `scheduled` | 📅 {weekday} {month} {day} · {time} |
| `confirmed` | ✓ confirmed · {weekday} {month} {day} · {time} |

### Lead-level status aggregation

Based on `enrollment_lead_program_bookings` statuses (one per program group). Evaluated in order (first match wins):

1. Any program booking `pending` or `link_sent`, none `scheduled`/`confirmed` → lead = `approved`
2. All program bookings `confirmed` → lead = `appointment_confirmed`
3. Otherwise (at least one `scheduled`/`confirmed`, remainder not yet) → lead = `appointment_scheduled`

### Action buttons

| Lead status | Buttons |
|-------------|---------|
| `new` | Approve & Send Invites · Deny |
| `approved` | Resend Invites · Pick Dates for Them · Deny |
| `appointment_scheduled` | Resend Invites · Pick Dates for Them |
| `appointment_confirmed` | Resend Invites · Pick Dates for Them |

### "Pick Dates for Them" modal (stacked layout)

One calendar section per **program type** (not per child), stacked vertically. Each section is color-coded (purple = Little Dragons, blue = Youth) and shows only slots matching that program type (plus `'all'` slots), with already-booked dates excluded.

For the example family: two calendar sections — Little Dragons and Youth. Admin picks one date per section. "Confirm All" writes both program bookings at once; partial save is allowed (admin can come back for the remaining program).

### Data loading

`getEnrollmentLeads` is updated to join both `enrollment_lead_children` and `enrollment_lead_program_bookings`, returning them inline on each lead:
```ts
lead.children: EnrollmentLeadChild[]
lead.programBookings: EnrollmentLeadProgramBooking[]
```
No N+1 queries — all data loads in one query.

### Search

Search matches on parent name, parent email, and any child name within `enrollment_lead_children`.

### Legacy leads

Leads with no child rows display: `[legacy] {student_name} · age {student_age}` or `[legacy] no child info` if both are null. All existing actions work unchanged.

---

## 4. Booking Flow

### Approval (`approve-enrollment-lead` edge function)

1. Verify admin auth (unchanged).
2. For each `enrollment_lead_program_bookings` row where `booking_token IS NULL`: generate a UUID token, set `status = 'link_sent'`.
3. Update `enrollment_leads.status = 'approved'`, set `approved_at`.
4. Send one approval email listing one booking link per program type:
   - `Book Little Dragons intro for Alex → /book/{token_ld}`
   - `Book Youth Program intro for Jordan & Sam → /book/{token_youth}`
5. **Idempotent**: re-approving only generates tokens for program bookings that don't have one yet.

### `BookingPage` (`/book/:token`)

Token resolves to `enrollment_lead_program_bookings` row. Page fetches:
- Program booking: `program_type`, `status`, `appointment_date`, `appointment_time`
- All children in this program for this family (via `lead_id + program_type` join to `enrollment_lead_children`)
- Parent's `parent_name` (via join to lead)

Page title: **"Book your [Little Dragons / Youth Program] intro"** with children's names listed.

Passes `program_type` to `getAppointmentSlots` — returns slots where `program_type IN (booking.program_type, 'all')` with booked dates excluded.

If booking `status` is already `scheduled` or `confirmed`, shows the appointment with reschedule option.

### `book-appointment` edge function

1. Resolve token → `enrollment_lead_program_bookings` row.
2. Write `appointment_date`, `appointment_time`, `appointment_slot_id`, `status = 'scheduled'` to that program booking row.
3. Recalculate and update `enrollment_leads.status` based on all program booking statuses (aggregation rule above).

### `resend-booking-link` edge function

Sends one email with booking links for all program bookings where `status IN ('pending', 'link_sent')`.

### `confirm-appointment` edge function

Writes `status = 'confirmed'` to the program booking row (resolved via token), then recalculates and updates the parent lead's status.

---

## 5. Admin Slot Management (`AdminAvailabilitySettings`)

### Slot create/edit form

Gains a **Program Type** dropdown:
- Little Dragons
- Youth Program
- All programs (default)

### Slot list display

```
Every Saturday  10:00–10:30   Little Dragons   [active]  [edit] [delete]
Every Monday    18:00–18:30   Youth Program    [active]  [edit] [delete]
Every Tuesday   17:00–17:30   All programs     [active]  [edit] [delete]
```

### `getAppointmentSlots` query

Gains optional `programType?: 'little_dragons' | 'youth'` parameter. When provided, returns slots where `program_type IN (programType, 'all')`. When omitted (admin management view), returns all slots.

---

## 6. `NewLeadModal` (admin-created leads)

Updated to match the public form's multi-child UI — same compact inline rows (name + age + ×), same `+ Add another child` link, same age validation (4–17), same program label preview. Submits the same `children` array to `submit_enrollment_lead`.

---

## Files Touched

| Layer | File |
|-------|------|
| Migration | `supabase/migrations/007_multi_child_enrollment.sql` |
| Types | `src/lib/types.ts` — add `EnrollmentLeadChild`, `EnrollmentLeadProgramBooking`; update `AppointmentSlot`, `EnrollmentLead` |
| Queries | `src/lib/supabase/queries.ts` — update `getEnrollmentLeads` (join children + program bookings), update `getAppointmentSlots`, update `get_upcoming_bookable_dates` |
| Mutations | `src/lib/supabase/mutations.ts` — update `submitEnrollmentLead` wrapper |
| Public form | `src/components/public/ContactPage.tsx` |
| Admin lead list | `src/components/admin/AdminEnrollmentLeadsTab.tsx` |
| Pick date modal | `src/components/admin/PickDateModal.tsx` |
| New lead modal | `src/components/admin/NewLeadModal.tsx` |
| Booking page | `src/pages/BookingPage.tsx` |
| Availability settings | `src/components/admin/AdminAvailabilitySettings.tsx` |
| Edge function | `supabase/functions/approve-enrollment-lead/index.ts` |
| Edge function | `supabase/functions/book-appointment/index.ts` |
| Edge function | `supabase/functions/resend-booking-link/index.ts` |
| Edge function | `supabase/functions/confirm-appointment/index.ts` |
| Email template | `supabase/functions/send-email/templates.ts` — add multi-child approval template |

---

## Out of Scope

- Per-child `enrolled` tracking — lead-level `enrolled` status is set manually by admin as today.
- Admin notification email changes (still fires on new lead submission, unchanged).
- Public-facing booking page redesign beyond token resolution and slot filtering.
