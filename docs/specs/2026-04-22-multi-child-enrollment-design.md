# Multi-Child Enrollment Form + Per-Child Appointment Booking

**Date:** 2026-04-22  
**Status:** Approved for implementation

---

## Overview

Replace the single-child enrollment form with a multi-child form, add program-typed appointment slots, and route each child to their own exclusive booking slot via a per-child booking link included in a single approval email.

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
- Age must be 4–17 inclusive. Any age outside this range blocks form submission with the message: *"We currently enroll ages 4–17. Please contact us directly for other inquiries."*
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

```sql
CREATE TABLE public.enrollment_lead_children (
  child_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id              UUID NOT NULL REFERENCES public.enrollment_leads(lead_id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  age                  INTEGER NOT NULL,
  program_type         TEXT NOT NULL CHECK (program_type IN ('little_dragons', 'youth')),
  booking_token        UUID UNIQUE,             -- generated on approval
  appointment_slot_id  UUID REFERENCES public.appointment_slots(slot_id),
  appointment_date     DATE,
  appointment_time     TIME,
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','link_sent','scheduled','confirmed')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT children_age_range CHECK (age >= 4 AND age <= 17)
);
```

RLS: admins can SELECT/UPDATE; anon/authenticated cannot read directly.

### `appointment_slots` — add program_type

```sql
ALTER TABLE public.appointment_slots
  ADD COLUMN program_type TEXT NOT NULL DEFAULT 'all'
    CHECK (program_type IN ('little_dragons', 'youth', 'all'));
```

Existing slots default to `'all'` (remain bookable by either program) until the admin re-tags them.

### Booked-date exclusion

`get_upcoming_bookable_dates(slot_id)` is updated to exclude any date already present in `enrollment_lead_children` for that `(slot_id, appointment_date)` pair with `status IN ('scheduled', 'confirmed')`. This enforces one booking per slot occurrence.

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

After inserting the lead row, iterates `p_children` and inserts one `enrollment_lead_children` row per child. `program_type` is derived: age 4–7 → `little_dragons`, age 8–17 → `youth`. Old `p_student_name`/`p_student_age` parameters are removed from the public-facing call; the columns remain on the table for backward-compatible reads of legacy leads.

### Backward compatibility

`enrollment_leads.student_name` and `enrollment_leads.student_age` columns are kept. New leads write no value to them. The admin UI renders a legacy fallback row (`[legacy] {student_name} · age {student_age}`) for leads with no child rows.

---

## 3. Admin Enrollment Lead Card

### Children section

Inserted between the contact info row and the message/notes area:

```
Alex     age 6   [Little Dragons]   📅 Sat Jan 11 · 10:00 AM
Jordan   age 15  [Youth Program]    link sent · not booked yet
```

Per-child status display:
| `status`    | Display |
|-------------|---------|
| `pending`   | awaiting approval |
| `link_sent` | link sent · not booked yet |
| `scheduled` | 📅 {weekday} {month} {day} · {time} |
| `confirmed` | ✓ confirmed · {weekday} {month} {day} · {time} |

### Lead-level status aggregation

The parent lead's `status` reflects the least-advanced child. Evaluated in order (first match wins):

1. Any child `pending` or `link_sent`, none `scheduled`/`confirmed` → lead = `approved`
2. All children `confirmed` → lead = `appointment_confirmed`
3. Otherwise (at least one `scheduled` or `confirmed`, remainder `link_sent`/`pending`) → lead = `appointment_scheduled`

This ensures a lead never "disappears" from the admin's view while any child is still unbooked.

### Action buttons

| Lead status | Buttons |
|-------------|---------|
| `new` | Approve & Send Invites · Deny |
| `approved` | Resend Invites · Pick Dates for Them · Deny |
| `appointment_scheduled` | Resend Invites · Pick Dates for Them |
| `appointment_confirmed` | Resend Invites · Pick Dates for Them |

### "Pick Dates for Them" modal (stacked layout)

One calendar section per child, stacked vertically. Each section is color-coded to program type (purple = Little Dragons, blue = Youth). Calendar shows only slots matching the child's `program_type` (plus `'all'` slots), with already-booked dates excluded. Admin picks a date per child. "Confirm All" writes all children's appointments at once; partial confirmation (some children picked, some not) is allowed — the admin can come back.

### Data loading

`getEnrollmentLeads` is updated to join `enrollment_lead_children` and return children inline on each lead object (`lead.children: EnrollmentLeadChild[]`). This avoids N+1 queries — the admin list loads all children in one query alongside their leads.

### Search

Search matches on parent name, parent email, and any child name within `enrollment_lead_children`.

### Legacy leads

Leads with no child rows display: `[legacy] {student_name} · age {student_age}` or `[legacy] no child info` if both are null. All existing actions work unchanged for legacy leads.

---

## 4. Booking Flow

### Approval (`approve-enrollment-lead` edge function)

1. Verify admin auth (unchanged).
2. Generate a `booking_token` (UUID) for each child row where `booking_token IS NULL`; set those children's `status = 'link_sent'`.
3. Update `enrollment_leads.status = 'approved'` and set `approved_at`.
4. Send one approval email to the parent. Email body lists a booking link per child:
   - `Book Alex's Little Dragons intro →  /book/{token_alex}`
   - `Book Jordan's Youth Program intro → /book/{token_jordan}`
5. **Idempotent**: re-approving a lead only generates tokens for children that don't have one yet; existing tokens are preserved.

### `BookingPage` (`/book/:token`)

Token resolves to `enrollment_lead_children` row (not `enrollment_leads.booking_token`). Page fetches:
- Child's `name`, `program_type`, `status`, `appointment_date`, `appointment_time`
- Parent's `parent_name` (via join to lead)

Passes `program_type` to `getAppointmentSlots` — returns slots where `program_type IN (child.program_type, 'all')` with booked dates excluded.

If child `status` is already `scheduled` or `confirmed`, shows the existing appointment with reschedule option (same behavior as today).

### `book-appointment` edge function

Updated to:
1. Resolve token → `enrollment_lead_children` row.
2. Write `appointment_date`, `appointment_time`, `appointment_slot_id`, `status = 'scheduled'` to the child row.
3. Recalculate and update `enrollment_leads.status` based on all children's statuses (aggregation rule above).

### `resend-booking-link` edge function

Sends one email with booking links for all children where `status IN ('pending', 'link_sent')` (i.e., not yet scheduled).

### `confirm-appointment` edge function

Updated to write `status = 'confirmed'` to the child row (resolved via token), then recalculate and update the parent lead's status.

---

## 5. Admin Slot Management (`AdminAvailabilitySettings`)

### Slot create/edit form

Gains a **Program Type** dropdown:
- Little Dragons
- Youth Program  
- All programs (default)

### Slot list display

Each slot row shows the program type label alongside the existing schedule string:
```
Every Saturday  10:00–10:30   Little Dragons   [active]  [edit] [delete]
Every Monday    18:00–18:30   Youth Program    [active]  [edit] [delete]
```

### `getAppointmentSlots` query

Gains optional `programType?: 'little_dragons' | 'youth' | 'all'` parameter. When provided, returns slots where `program_type IN (programType, 'all')`. When omitted (admin management view), returns all slots.

---

## 6. `NewLeadModal` (admin-created leads)

Updated to match the public form's multi-child UI — same compact inline rows (name + age + ×), same "+ Add another child" link, same age validation (4–17), same program label preview. Submits the same `children` array to `submit_enrollment_lead`.

---

## Files Touched

| Layer | File |
|-------|------|
| Migration | `supabase/migrations/007_multi_child_enrollment.sql` |
| Types | `src/lib/types.ts` — add `EnrollmentLeadChild`, update `AppointmentSlot`, update `EnrollmentLead` |
| Queries | `src/lib/supabase/queries.ts` — update `getAppointmentSlots`, `get_upcoming_bookable_dates`, add `getLeadChildren` |
| Mutations | `src/lib/supabase/mutations.ts` — update `submit_enrollment_lead` wrapper |
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

- Enrollment status per child beyond `confirmed` (e.g., per-child `enrolled` tracking) — lead-level `enrolled` status is set manually by admin as today.
- Admin notification email changes (still fires on new lead submission, unchanged).
- Public-facing booking page redesign beyond token resolution and slot filtering.
