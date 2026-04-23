# Multi-Child Enrollment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-child enrollment form with multi-child support, add per-program appointment booking, and route each program group (not each child) to its own booking slot.

**Architecture:** New `enrollment_lead_children` table stores child identity. New `enrollment_lead_program_bookings` table stores one booking row per (lead, program_type) — siblings in the same program share one slot. `appointment_slots` gains a `program_type` field. The parent receives one booking link per program in the approval email.

**Tech Stack:** React + TypeScript + Vite, Supabase (PostgREST, Edge Functions/Deno), shadcn/ui, Tailwind CSS

**Spec:** `docs/specs/2026-04-22-multi-child-enrollment-design.md`

---

### Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/007_multi_child_enrollment.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/007_multi_child_enrollment.sql

-- 1. program_type on appointment_slots
ALTER TABLE public.appointment_slots
  ADD COLUMN IF NOT EXISTS program_type TEXT NOT NULL DEFAULT 'all'
    CHECK (program_type IN ('little_dragons', 'youth', 'all'));

-- 2. enrollment_lead_children
CREATE TABLE IF NOT EXISTS public.enrollment_lead_children (
  child_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id      UUID NOT NULL REFERENCES public.enrollment_leads(lead_id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  age          INTEGER NOT NULL,
  program_type TEXT NOT NULL CHECK (program_type IN ('little_dragons', 'youth')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT children_age_range CHECK (age >= 4 AND age <= 17)
);
CREATE INDEX IF NOT EXISTS idx_elc_lead_id ON public.enrollment_lead_children(lead_id);

-- 3. enrollment_lead_program_bookings
CREATE TABLE IF NOT EXISTS public.enrollment_lead_program_bookings (
  booking_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id             UUID NOT NULL REFERENCES public.enrollment_leads(lead_id) ON DELETE CASCADE,
  program_type        TEXT NOT NULL CHECK (program_type IN ('little_dragons', 'youth')),
  booking_token       UUID UNIQUE,
  appointment_slot_id UUID REFERENCES public.appointment_slots(slot_id),
  appointment_date    DATE,
  appointment_time    TIME,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','link_sent','scheduled','confirmed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lead_id, program_type)
);
CREATE INDEX IF NOT EXISTS idx_elpb_lead_id ON public.enrollment_lead_program_bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_elpb_token  ON public.enrollment_lead_program_bookings(booking_token);

-- 4. RLS
ALTER TABLE public.enrollment_lead_children         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_lead_program_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view enrollment lead children" ON public.enrollment_lead_children;
CREATE POLICY "Admins can view enrollment lead children"
  ON public.enrollment_lead_children FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update enrollment lead children" ON public.enrollment_lead_children;
CREATE POLICY "Admins can update enrollment lead children"
  ON public.enrollment_lead_children FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view enrollment lead program bookings" ON public.enrollment_lead_program_bookings;
CREATE POLICY "Admins can view enrollment lead program bookings"
  ON public.enrollment_lead_program_bookings FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update enrollment lead program bookings" ON public.enrollment_lead_program_bookings;
CREATE POLICY "Admins can update enrollment lead program bookings"
  ON public.enrollment_lead_program_bookings FOR UPDATE USING (is_admin(auth.uid()));

GRANT SELECT, UPDATE ON public.enrollment_lead_children         TO authenticated;
GRANT SELECT, UPDATE ON public.enrollment_lead_program_bookings TO authenticated;

-- 5. get_upcoming_bookable_dates — exclude already-booked slot+date pairs
CREATE OR REPLACE FUNCTION public.get_upcoming_bookable_dates(
  p_slot_id    UUID,
  p_weeks_ahead INT DEFAULT 20
)
RETURNS TABLE(available_date DATE)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_slot       appointment_slots%ROWTYPE;
  v_check_date DATE := CURRENT_DATE + 1;
  v_end_date   DATE := CURRENT_DATE + (p_weeks_ahead * 7);
BEGIN
  SELECT * INTO v_slot FROM appointment_slots
  WHERE slot_id = p_slot_id AND is_active = true;
  IF NOT FOUND THEN RETURN; END IF;

  WHILE v_check_date <= v_end_date LOOP
    IF EXTRACT(DOW FROM v_check_date)::INTEGER = v_slot.day_of_week THEN
      IF (
        v_slot.week_of_month IS NULL
        OR (v_slot.week_of_month = -1
            AND DATE_TRUNC('month', v_check_date + 7) <> DATE_TRUNC('month', v_check_date))
        OR (v_slot.week_of_month BETWEEN 1 AND 4
            AND CEIL(EXTRACT(DAY FROM v_check_date) / 7.0)::INTEGER = v_slot.week_of_month)
      ) THEN
        IF NOT EXISTS (
          SELECT 1 FROM appointment_slot_overrides o
          WHERE o.slot_id = p_slot_id AND o.override_date = v_check_date
        )
        AND NOT EXISTS (
          SELECT 1 FROM enrollment_lead_program_bookings pb
          WHERE pb.appointment_slot_id = p_slot_id
            AND pb.appointment_date = v_check_date
            AND pb.status IN ('scheduled','confirmed')
        )
        THEN
          available_date := v_check_date;
          RETURN NEXT;
        END IF;
      END IF;
    END IF;
    v_check_date := v_check_date + 1;
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_upcoming_bookable_dates(UUID, INT) TO anon, authenticated;

-- 6. submit_enrollment_lead — accept children JSONB, remove student_name/age params
CREATE OR REPLACE FUNCTION public.submit_enrollment_lead(
  p_parent_name  TEXT,
  p_parent_email TEXT,
  p_phone        TEXT DEFAULT NULL,
  p_message      TEXT DEFAULT NULL,
  p_source_page  TEXT DEFAULT 'contact',
  p_children     JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_lead_id       UUID;
  v_notif_email   TEXT;
  v_parent_name   TEXT := trim(COALESCE(p_parent_name,''));
  v_parent_email  TEXT := lower(trim(COALESCE(p_parent_email,'')));
  v_phone         TEXT := NULLIF(trim(COALESCE(p_phone,'')),'');
  v_message       TEXT := NULLIF(trim(COALESCE(p_message,'')),'');
  v_source_page   TEXT := COALESCE(NULLIF(trim(COALESCE(p_source_page,'')),''),'contact');
  v_child         JSONB;
  v_age           INTEGER;
  v_program       TEXT;
  v_programs_seen TEXT[] := '{}';
BEGIN
  IF length(v_parent_name) < 2 THEN RAISE EXCEPTION 'Parent name must be at least 2 characters.'; END IF;
  IF length(v_parent_email) < 5 OR position('@' IN v_parent_email) <= 1 THEN RAISE EXCEPTION 'Please provide a valid email.'; END IF;
  IF v_message IS NULL THEN v_message := 'Enrollment lead submitted from public website.'; END IF;

  v_notif_email := lower(COALESCE(
    NULLIF(trim(current_setting('app.lbmaa_faculty_notification_email', true)),''),
    'vincethanhdoan@gmail.com'
  ));

  INSERT INTO public.enrollment_leads (parent_name, parent_email, phone, message, source_page, notification_status, notified_at)
  VALUES (v_parent_name, v_parent_email, v_phone, v_message, v_source_page, 'queued', NOW())
  RETURNING lead_id INTO v_lead_id;

  INSERT INTO public.enrollment_lead_notifications (lead_id, recipient_email, channel, status)
  VALUES (v_lead_id, v_notif_email, 'email', 'queued');

  IF p_children IS NOT NULL AND jsonb_array_length(p_children) > 0 THEN
    FOR v_child IN SELECT * FROM jsonb_array_elements(p_children) LOOP
      v_age := (v_child->>'age')::INTEGER;
      IF v_age BETWEEN 4 AND 7 THEN v_program := 'little_dragons';
      ELSIF v_age BETWEEN 8 AND 17 THEN v_program := 'youth';
      ELSE RAISE EXCEPTION 'Child age must be between 4 and 17.';
      END IF;
      INSERT INTO public.enrollment_lead_children (lead_id, name, age, program_type)
      VALUES (v_lead_id, trim(v_child->>'name'), v_age, v_program);
      IF NOT (v_program = ANY(v_programs_seen)) THEN
        INSERT INTO public.enrollment_lead_program_bookings (lead_id, program_type, status)
        VALUES (v_lead_id, v_program, 'pending');
        v_programs_seen := v_programs_seen || v_program;
      END IF;
    END LOOP;
  END IF;

  RETURN v_lead_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_enrollment_lead(TEXT,TEXT,TEXT,TEXT,TEXT,JSONB) TO anon, authenticated;
DROP FUNCTION IF EXISTS public.submit_enrollment_lead(TEXT,TEXT,TEXT,TEXT,INTEGER,TEXT,TEXT);

-- 7. create_enrollment_lead (admin) — same treatment
CREATE OR REPLACE FUNCTION public.create_enrollment_lead(
  p_parent_name  TEXT,
  p_parent_email TEXT,
  p_phone        TEXT DEFAULT NULL,
  p_notes        TEXT DEFAULT NULL,
  p_children     JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_lead_id       UUID;
  v_child         JSONB;
  v_age           INTEGER;
  v_program       TEXT;
  v_programs_seen TEXT[] := '{}';
BEGIN
  IF NOT is_admin(auth.uid()) THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  INSERT INTO public.enrollment_leads (parent_name, parent_email, phone, message, source_page, status)
  VALUES (
    trim(p_parent_name),
    lower(trim(p_parent_email)),
    NULLIF(trim(COALESCE(p_phone,'')),''),
    COALESCE(NULLIF(trim(COALESCE(p_notes,'')),''), 'Lead created manually by admin.'),
    'admin', 'new'
  )
  RETURNING lead_id INTO v_lead_id;

  IF p_children IS NOT NULL AND jsonb_array_length(p_children) > 0 THEN
    FOR v_child IN SELECT * FROM jsonb_array_elements(p_children) LOOP
      v_age := (v_child->>'age')::INTEGER;
      IF v_age BETWEEN 4 AND 7 THEN v_program := 'little_dragons';
      ELSIF v_age BETWEEN 8 AND 17 THEN v_program := 'youth';
      ELSE RAISE EXCEPTION 'Child age must be between 4 and 17.';
      END IF;
      INSERT INTO public.enrollment_lead_children (lead_id, name, age, program_type)
      VALUES (v_lead_id, trim(v_child->>'name'), v_age, v_program);
      IF NOT (v_program = ANY(v_programs_seen)) THEN
        INSERT INTO public.enrollment_lead_program_bookings (lead_id, program_type, status)
        VALUES (v_lead_id, v_program, 'pending');
        v_programs_seen := v_programs_seen || v_program;
      END IF;
    END LOOP;
  END IF;

  RETURN v_lead_id;
END;
$$;
DROP FUNCTION IF EXISTS public.create_enrollment_lead(TEXT,TEXT,TEXT,TEXT,INTEGER,TEXT);
GRANT EXECUTE ON FUNCTION public.create_enrollment_lead(TEXT,TEXT,TEXT,TEXT,JSONB) TO authenticated;

-- 8. get_program_booking_by_token — resolves a booking token to booking + children
CREATE OR REPLACE FUNCTION public.get_program_booking_by_token(p_token UUID)
RETURNS TABLE(
  booking_id       UUID,
  program_type     TEXT,
  status           TEXT,
  appointment_date DATE,
  appointment_time TIME,
  parent_name      TEXT,
  child_names      TEXT[]
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    pb.booking_id,
    pb.program_type,
    pb.status,
    pb.appointment_date,
    pb.appointment_time,
    el.parent_name,
    ARRAY(
      SELECT c.name FROM enrollment_lead_children c
      WHERE c.lead_id = pb.lead_id AND c.program_type = pb.program_type
      ORDER BY c.created_at
    ) AS child_names
  FROM enrollment_lead_program_bookings pb
  JOIN enrollment_leads el ON el.lead_id = pb.lead_id
  WHERE pb.booking_token = p_token
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_program_booking_by_token(UUID) TO anon, authenticated;
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use the `mcp__supabase__apply_migration` tool with `name = "007_multi_child_enrollment"` and the SQL above.

- [ ] **Step 3: Verify tables exist**

Use `mcp__supabase__execute_sql` with:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('enrollment_lead_children','enrollment_lead_program_bookings');
```
Expected: 2 rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/007_multi_child_enrollment.sql
git commit -m "feat: add multi-child enrollment schema and updated RPCs"
```

---

### Task 2: TypeScript Types

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/supabase/selects.ts`

- [ ] **Step 1: Add new types and update existing types in `src/lib/types.ts`**

After the `EnrollmentLead` type block, add:

```ts
export type EnrollmentLeadChild = {
  child_id: string;
  lead_id: string;
  name: string;
  age: number;
  program_type: 'little_dragons' | 'youth';
  created_at: string;
};

export type EnrollmentLeadProgramBooking = {
  booking_id: string;
  lead_id: string;
  program_type: 'little_dragons' | 'youth';
  booking_token: string | null;
  appointment_slot_id: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  status: 'pending' | 'link_sent' | 'scheduled' | 'confirmed';
  created_at: string;
};
```

Add two new optional fields to `EnrollmentLead` (at the end, before the closing `}`):

```ts
  children: EnrollmentLeadChild[];
  programBookings: EnrollmentLeadProgramBooking[];
```

Update `AppointmentSlot` — change:
```ts
  is_active: boolean;
```
to:
```ts
  is_active: boolean;
  program_type: 'little_dragons' | 'youth' | 'all';
```

- [ ] **Step 2: Update `ENROLLMENT_LEAD_COLUMNS` in `src/lib/supabase/selects.ts`**

The nested join is done inline in the query (not via this constant), so no change needed to `ENROLLMENT_LEAD_COLUMNS` — it stays as the flat column list. The `getEnrollmentLeads` function will use it alongside the nested select.

- [ ] **Step 3: Type-check**

```bash
npm run build
```
Expected: zero TypeScript errors. Fix any that appear before proceeding.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add EnrollmentLeadChild and EnrollmentLeadProgramBooking types"
```

---

### Task 3: Data Layer (Queries, Client, Mutations)

**Files:**
- Modify: `src/lib/supabase/queries.ts`
- Modify: `src/lib/supabase/client.ts`
- Modify: `src/lib/supabase/mutations.ts`

- [ ] **Step 1: Update `getEnrollmentLeads` in `queries.ts`**

Replace the existing `getEnrollmentLeads` function:

```ts
export async function getEnrollmentLeads(): Promise<EnrollmentLead[]> {
  const { data, error } = await supabase
    .from('enrollment_leads')
    .select(`
      ${ENROLLMENT_LEAD_COLUMNS},
      children:enrollment_lead_children(child_id, lead_id, name, age, program_type, created_at),
      programBookings:enrollment_lead_program_bookings(booking_id, lead_id, program_type, booking_token, appointment_slot_id, appointment_date, appointment_time, status, created_at)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(row => ({
    ...row,
    children: (row.children ?? []) as EnrollmentLeadChild[],
    programBookings: (row.programBookings ?? []) as EnrollmentLeadProgramBooking[],
  })) as EnrollmentLead[];
}
```

Also add the import at the top of the imports from `'../types'`:
```ts
import type {
  // ... existing ...
  EnrollmentLeadChild,
  EnrollmentLeadProgramBooking,
} from '../types';
```

- [ ] **Step 2: Update `getAppointmentSlots` to accept `programType` filter**

Replace:
```ts
export async function getAppointmentSlots(): Promise<AppointmentSlot[]> {
  const { data, error } = await supabase
    .from('appointment_slots')
    .select('*')
    .eq('is_active', true)
    .order('day_of_week')
  if (error) throw error
  return data ?? []
}
```

With:
```ts
export async function getAppointmentSlots(
  programType?: 'little_dragons' | 'youth'
): Promise<AppointmentSlot[]> {
  let query = supabase
    .from('appointment_slots')
    .select('*')
    .eq('is_active', true)
    .order('day_of_week');

  if (programType) {
    query = query.in('program_type', [programType, 'all']);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 3: Add `getProgramBookingByToken` to `queries.ts`**

After `getLeadByToken`:

```ts
export async function getProgramBookingByToken(token: string): Promise<{
  booking_id: string;
  program_type: 'little_dragons' | 'youth';
  status: string;
  appointment_date: string | null;
  appointment_time: string | null;
  parent_name: string;
  child_names: string[];
} | null> {
  const { data, error } = await supabase.rpc('get_program_booking_by_token', { p_token: token });
  if (error) throw error;
  return data?.[0] ?? null;
}
```

- [ ] **Step 4: Update `EnrollmentLeadInput` and `submitEnrollmentLeadWithTimeout` in `client.ts`**

Replace `EnrollmentLeadInput`:
```ts
export type EnrollmentLeadInput = {
  parentName: string;
  parentEmail: string;
  phone?: string;
  message?: string;
  sourcePage?: string;
  children: Array<{ name: string; age: number }>;
};
```

In `submitEnrollmentLeadWithTimeout`, replace the `body: JSON.stringify(...)` block:
```ts
body: JSON.stringify({
  p_parent_name: input.parentName,
  p_parent_email: input.parentEmail,
  p_phone: input.phone ?? null,
  p_message: input.message ?? null,
  p_source_page: input.sourcePage ?? 'contact',
  p_children: input.children,
}),
```

- [ ] **Step 5: Update `createEnrollmentLead` in `mutations.ts`**

Replace:
```ts
export async function createEnrollmentLead(fields: {
  parentName: string
  parentEmail: string
  phone?: string
  studentName?: string
  studentAge?: number
  notes?: string
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_enrollment_lead', {
    p_parent_name: fields.parentName,
    p_parent_email: fields.parentEmail,
    p_phone: fields.phone ?? null,
    p_student_name: fields.studentName ?? null,
    p_student_age: fields.studentAge ?? null,
    p_notes: fields.notes ?? null,
  })
  if (error) throw error
  return data as string
}
```

With:
```ts
export async function createEnrollmentLead(fields: {
  parentName: string
  parentEmail: string
  phone?: string
  notes?: string
  children: Array<{ name: string; age: number }>
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_enrollment_lead', {
    p_parent_name: fields.parentName,
    p_parent_email: fields.parentEmail,
    p_phone: fields.phone ?? null,
    p_notes: fields.notes ?? null,
    p_children: fields.children,
  })
  if (error) throw error
  return data as string
}
```

- [ ] **Step 6: Type-check**

```bash
npm run build
```
Expected: zero errors. Fix any before proceeding.

- [ ] **Step 7: Commit**

```bash
git add src/lib/supabase/queries.ts src/lib/supabase/client.ts src/lib/supabase/mutations.ts
git commit -m "feat: update data layer for multi-child enrollment and per-program booking"
```

---

### Task 4: ContactPage — Multi-Child Form

**Files:**
- Modify: `src/components/public/ContactPage.tsx`

- [ ] **Step 1: Rewrite the form section of `ContactPage.tsx`**

Replace the `useState` block and form content. The full updated file:

```tsx
import { useState } from 'react';
import { CheckCircle2, AlertCircle, X, Plus } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { submitEnrollmentLeadWithTimeout } from '../../lib/supabase/client';
import { V3 } from './design';

const REASSURANCES = [
  'First class is free — no commitment',
  'We respond within 24 hours',
  "We're here to help, not to pressure",
];

const CONTACT_INFO = [
  { label: 'Phone', value: '(209) 555-0123', href: 'tel:+12095550123' },
  { label: 'Email', value: 'info@lbmaa.com', href: 'mailto:info@lbmaa.com' },
];

const HOURS = [
  { day: 'Mon – Fri', time: '3:00 – 8:30 PM' },
  { day: 'Saturday',  time: '9:00 AM – 2:00 PM' },
  { day: 'Sunday',    time: 'Closed' },
];

type ChildRow = { name: string; age: string };

function programLabel(age: string): { text: string; color: string } | null {
  const n = Number(age);
  if (!age || isNaN(n)) return null;
  if (n >= 4 && n <= 7)  return { text: 'Little Dragons · ages 4–7',  color: '#6d28d9' };
  if (n >= 8 && n <= 17) return { text: 'Youth Program · ages 8–17', color: '#1d4ed8' };
  return { text: 'Age must be 4–17', color: '#dc2626' };
}

export function ContactPage() {
  const [parentName,  setParentName]  = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [phone,       setPhone]       = useState('');
  const [message,     setMessage]     = useState('');
  const [children,    setChildren]    = useState<ChildRow[]>([{ name: '', age: '' }]);
  const [submitted,   setSubmitted]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addChild() {
    setChildren(prev => [...prev, { name: '', age: '' }]);
  }

  function removeChild(i: number) {
    setChildren(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateChild(i: number, field: 'name' | 'age', value: string) {
    setChildren(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    for (const c of children) {
      if (!c.name.trim() || !c.age) {
        setSubmitError('Each child must have a name and age.');
        return;
      }
      const age = Number(c.age);
      if (!Number.isInteger(age) || age < 4 || age > 17) {
        setSubmitError('We currently enroll ages 4–17. Please contact us directly for other inquiries.');
        return;
      }
    }

    setIsSubmitting(true);
    const { data, error } = await submitEnrollmentLeadWithTimeout(
      {
        parentName,
        parentEmail,
        phone: phone || undefined,
        message: message || undefined,
        sourcePage: 'contact',
        children: children.map(c => ({ name: c.name.trim(), age: Number(c.age) })),
      },
      12000,
    );

    if (error || !data) {
      setSubmitError(error?.message || 'Unable to submit right now. Please try again or call us directly.');
      setIsSubmitting(false);
      return;
    }
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div>
      {/* ── PAGE HERO ── */}
      <section className="py-14" style={{ backgroundColor: V3.surface, borderBottom: `1px solid ${V3.border}` }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <p className="v3-eyebrow mb-4">Get In Touch</p>
          <h1 className="v3-h font-black leading-[1.0] mb-5" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: V3.text }}>
            We'd Love to Hear From You
          </h1>
          <p className="text-base leading-relaxed max-w-xl" style={{ color: V3.muted }}>
            Questions about our programs? Ready to book a trial class? We'll respond within one business day — no sales calls, no pressure.
          </p>
        </div>
      </section>

      {/* ── CONTACT GRID ── */}
      <section className="py-16" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl items-start">

            {/* ── FORM ── */}
            <div>
              <h2 className="v3-h font-black text-3xl mb-2" style={{ color: V3.text }}>Send Us a Message</h2>
              <p className="text-sm mb-8" style={{ color: V3.muted }}>Fill out the form and we'll be in touch within one business day.</p>

              {submitted ? (
                <div className="py-16 text-center rounded-xl" style={{ backgroundColor: V3.surface, border: `1px solid ${V3.border}` }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: V3.primaryBg }}>
                    <CheckCircle2 className="w-8 h-8" style={{ color: V3.primary }} />
                  </div>
                  <h3 className="v3-h text-2xl font-black mb-2" style={{ color: V3.text }}>We Got Your Message</h3>
                  <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: V3.muted }}>
                    We'll be in touch within 24 hours to answer your questions and get your child scheduled for a free trial class.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="parentName">Your name <span style={{ color: V3.primary }}>*</span></Label>
                      <Input id="parentName" placeholder="Jane Smith" value={parentName} onChange={e => setParentName(e.target.value)} disabled={isSubmitting} required className="min-h-[48px]" autoComplete="name" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="phone">Phone <span className="font-normal" style={{ color: V3.muted }}>(optional)</span></Label>
                      <Input id="phone" type="tel" placeholder="(209) 555-0100" value={phone} onChange={e => setPhone(e.target.value)} disabled={isSubmitting} className="min-h-[48px]" autoComplete="tel" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="parentEmail">Email address <span style={{ color: V3.primary }}>*</span></Label>
                    <Input id="parentEmail" type="email" placeholder="you@example.com" value={parentEmail} onChange={e => setParentEmail(e.target.value)} disabled={isSubmitting} required className="min-h-[48px]" autoComplete="email" />
                  </div>

                  {/* Children */}
                  <div className="flex flex-col gap-2 pt-1">
                    <Label>Children enrolling <span style={{ color: V3.primary }}>*</span></Label>
                    <p className="text-xs" style={{ color: V3.muted }}>Name and age required · We use age to place your child in the right program</p>
                    {children.map((child, i) => {
                      const pl = programLabel(child.age);
                      return (
                        <div key={i} className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Child's name"
                              value={child.name}
                              onChange={e => updateChild(i, 'name', e.target.value)}
                              disabled={isSubmitting}
                              required
                              className="min-h-[44px] flex-1"
                            />
                            <Input
                              type="number"
                              min={4}
                              max={17}
                              placeholder="Age"
                              value={child.age}
                              onChange={e => updateChild(i, 'age', e.target.value)}
                              disabled={isSubmitting}
                              required
                              className="min-h-[44px] w-20"
                            />
                            {children.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeChild(i)}
                                disabled={isSubmitting}
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                                style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {pl && (
                            <p className="text-xs font-medium pl-1" style={{ color: pl.color }}>{pl.text}</p>
                          )}
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={addChild}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 text-sm self-start transition-opacity hover:opacity-70"
                      style={{ color: V3.primary }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add another child
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="message">Questions or notes <span className="font-normal" style={{ color: V3.muted }}>(optional)</span></Label>
                    <Textarea id="message" placeholder="Preferred schedule, questions about programs, or anything else on your mind." rows={4} value={message} onChange={e => setMessage(e.target.value)} disabled={isSubmitting} />
                  </div>

                  {submitError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  )}

                  <button type="submit" disabled={isSubmitting} className="v3-btn-primary w-full" style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                    {isSubmitting ? 'Sending…' : 'Send Message'}
                  </button>

                  <p className="text-xs text-center" style={{ color: V3.muted }}>* Required. We'll never share your information.</p>
                </form>
              )}
            </div>

            {/* ── INFO SIDE ── */}
            <div>
              <h2 className="v3-h font-black text-3xl mb-2" style={{ color: V3.text }}>Find Us</h2>
              <p className="text-sm mb-8" style={{ color: V3.muted }}>Stop by, call, or drop us a line.</p>
              <div className="mb-6">
                <p className="v3-eyebrow mb-2">Location</p>
                <p className="text-sm leading-relaxed" style={{ color: V3.muted }}>123 Main Street<br />Los Banos, CA 93635</p>
              </div>
              <div className="mb-6 pt-6" style={{ borderTop: `1px solid ${V3.border}` }}>
                <p className="v3-eyebrow mb-3">Class Hours</p>
                <div className="flex flex-col gap-1.5">
                  {HOURS.map(({ day, time }) => (
                    <div key={day} className="flex justify-between text-sm gap-4">
                      <span style={{ color: V3.text }}>{day}</span>
                      <span style={{ color: V3.muted }}>{time}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-8 pt-6" style={{ borderTop: `1px solid ${V3.border}` }}>
                <p className="v3-eyebrow mb-3">Phone &amp; Email</p>
                <div className="flex flex-col gap-2">
                  {CONTACT_INFO.map(({ label, value, href }) => (
                    <div key={label} className="flex items-center gap-3 text-sm">
                      <span className="w-10 flex-shrink-0 font-semibold" style={{ color: V3.muted }}>{label}</span>
                      <a href={href} className="transition-colors hover:opacity-80" style={{ color: V3.primary }}>{value}</a>
                    </div>
                  ))}
                  <p className="text-xs mt-1" style={{ color: V3.muted }}>We reply within 1 business day</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-6" style={{ borderTop: `1px solid ${V3.border}` }}>
                {REASSURANCES.map((pt) => (
                  <div key={pt} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: V3.primary }} />
                    <span className="text-sm" style={{ color: V3.muted }}>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAP ── */}
      <section style={{ borderTop: `1px solid ${V3.border}` }}>
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${V3.border}` }}>
            <iframe
              title="LBMAA Location"
              src="https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=Los+Banos,CA"
              width="100%"
              height="320"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```
Expected: zero errors.

- [ ] **Step 3: Smoke test in dev**

```bash
npm run dev
```
Open `/` → navigate to Contact page. Verify:
- One child row shows by default, no × button
- Adding a second child shows × on both
- Entering age 6 shows "Little Dragons · ages 4–7" in purple
- Entering age 15 shows "Youth Program · ages 8–17" in blue
- Entering age 3 shows "Age must be 4–17" in red and blocks submit
- Submitting with valid data succeeds and shows the confirmation card

- [ ] **Step 4: Commit**

```bash
git add src/components/public/ContactPage.tsx
git commit -m "feat: multi-child enrollment form on ContactPage"
```

---

### Task 5: NewLeadModal — Multi-Child

**Files:**
- Modify: `src/components/admin/NewLeadModal.tsx`

- [ ] **Step 1: Replace the form state and fields in `NewLeadModal.tsx`**

The modal currently uses `studentName` / `studentAge` single fields. Replace with the `children` array pattern. Key changes only (keep the rest of the modal logic intact):

Replace state:
```ts
const [studentName, setStudentName] = useState('')
const [studentAge, setStudentAge]   = useState('')
```
with:
```ts
const [children, setChildren] = useState<Array<{ name: string; age: string }>>([{ name: '', age: '' }])
```

Add helpers (same as ContactPage):
```ts
function addChild() {
  setChildren(prev => [...prev, { name: '', age: '' }])
}
function removeChild(i: number) {
  setChildren(prev => prev.filter((_, idx) => idx !== i))
}
function updateChild(i: number, field: 'name' | 'age', value: string) {
  setChildren(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
}
```

Update `validate()`:
```ts
function validate() {
  const errs: { parentName?: string; parentEmail?: string; children?: string } = {}
  if (!parentName.trim()) errs.parentName = 'Required'
  if (!parentEmail.trim()) errs.parentEmail = 'Required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) errs.parentEmail = 'Invalid email'
  for (const c of children) {
    const age = Number(c.age)
    if (!c.name.trim() || !c.age) { errs.children = 'Each child requires a name and age.'; break }
    if (!Number.isInteger(age) || age < 4 || age > 17) { errs.children = 'Child ages must be between 4 and 17.'; break }
  }
  setErrors(errs)
  return Object.keys(errs).length === 0
}
```

Update `handleSubmit` call to `createEnrollmentLead`:
```ts
const leadId = await createEnrollmentLead({
  parentName: parentName.trim(),
  parentEmail: parentEmail.trim(),
  phone: phone.trim() || undefined,
  notes: notes.trim() || undefined,
  children: children.map(c => ({ name: c.name.trim(), age: Number(c.age) })),
})
```

Replace the child fields in the JSX with the same inline rows + "Add another child" pattern as `ContactPage` (same structure: name Input, age Input width-20, × button, program label below):

```tsx
{/* Children */}
<div className="flex flex-col gap-2">
  <Label>Children <span className="text-destructive">*</span></Label>
  {children.map((child, i) => {
    const age = Number(child.age)
    const progLabel = child.age
      ? (age >= 4 && age <= 7 ? { text: 'Little Dragons · 4–7', color: '#6d28d9' }
        : age >= 8 && age <= 17 ? { text: 'Youth Program · 8–17', color: '#1d4ed8' }
        : { text: 'Age must be 4–17', color: '#dc2626' })
      : null
    return (
      <div key={i} className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Input placeholder="Name" value={child.name} onChange={e => updateChild(i,'name',e.target.value)} disabled={loading} required className="flex-1 h-9 text-sm" />
          <Input type="number" min={4} max={17} placeholder="Age" value={child.age} onChange={e => updateChild(i,'age',e.target.value)} disabled={loading} required className="w-16 h-9 text-sm" />
          {children.length > 1 && (
            <button type="button" onClick={() => removeChild(i)} disabled={loading}
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#fee2e2', color: '#ef4444' }}>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {progLabel && <p className="text-xs font-medium pl-0.5" style={{ color: progLabel.color }}>{progLabel.text}</p>}
      </div>
    )
  })}
  <button type="button" onClick={addChild} disabled={loading}
    className="flex items-center gap-1 text-xs text-primary self-start hover:opacity-70">
    <Plus className="w-3 h-3" /> Add another child
  </button>
  {errors.children && <p className="text-xs text-destructive">{errors.children}</p>}
</div>
```

Add imports `X` and `Plus` from `lucide-react`.

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Smoke test**

In the admin portal, open "New Lead" modal. Verify:
- Multi-child rows work with + and ×
- Program labels appear on age entry
- Submitting creates a lead visible in the New tab with correct children

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/NewLeadModal.tsx
git commit -m "feat: multi-child support in NewLeadModal"
```

---

### Task 6: Admin Lead Card — Children + Program Bookings Display

**Files:**
- Modify: `src/components/admin/AdminEnrollmentLeadsTab.tsx`

- [ ] **Step 1: Add constants and helpers at the top of the component file**

After imports, add:

```ts
const PROGRAM_LABELS: Record<string, string> = {
  little_dragons: 'Little Dragons',
  youth: 'Youth Program',
}

const PROGRAM_BADGE_STYLES: Record<string, string> = {
  little_dragons: 'bg-purple-100 text-purple-700',
  youth: 'bg-blue-100 text-blue-700',
}

function formatProgramBookingStatus(booking: { status: string; appointment_date: string | null; appointment_time: string | null }): string {
  if (booking.status === 'pending') return 'awaiting approval'
  if (booking.status === 'link_sent') return 'link sent · not booked yet'
  if ((booking.status === 'scheduled' || booking.status === 'confirmed') && booking.appointment_date) {
    const date = new Date(booking.appointment_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    const time = booking.appointment_time
      ? new Date('1970-01-01T' + booking.appointment_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : ''
    const icon = booking.status === 'confirmed' ? '✓' : '📅'
    return `${icon} ${date}${time ? ' · ' + time : ''}`
  }
  return booking.status
}

function computeLeadStatus(programBookings: EnrollmentLead['programBookings']): EnrollmentLead['status'] {
  if (!programBookings?.length) return 'new'
  const statuses = programBookings.map(b => b.status)
  if (statuses.every(s => s === 'confirmed')) return 'appointment_confirmed'
  if (statuses.some(s => s === 'scheduled' || s === 'confirmed')) return 'appointment_scheduled'
  return 'approved'
}
```

Also add `EnrollmentLeadChild` and `EnrollmentLeadProgramBooking` to the type import.

- [ ] **Step 2: Update `filterLeads` to search child names**

In the `if (search.trim())` block, update the filter:
```ts
result = result.filter(l =>
  l.parent_name.toLowerCase().includes(q) ||
  l.parent_email.toLowerCase().includes(q) ||
  (l.student_name?.toLowerCase().includes(q) ?? false) ||
  (l.children?.some(c => c.name.toLowerCase().includes(q)) ?? false)
);
```

- [ ] **Step 3: Add a `ChildrenSection` component inside the file (above `AdminEnrollmentLeadsTab`)**

```tsx
function ChildrenSection({ lead }: { lead: EnrollmentLead }) {
  const hasChildren = lead.children && lead.children.length > 0
  const hasBookings = lead.programBookings && lead.programBookings.length > 0

  if (!hasChildren && !lead.student_name) return null

  // Legacy lead — no children rows
  if (!hasChildren) {
    return (
      <p className="text-sm text-muted-foreground">
        [legacy] {lead.student_name}{lead.student_age ? `, age ${lead.student_age}` : ''}
      </p>
    )
  }

  if (!hasBookings) {
    // Children exist but no bookings yet (shouldn't happen in practice)
    return (
      <div className="flex flex-col gap-1">
        {lead.children.map(c => (
          <div key={c.child_id} className="flex items-center gap-2 text-sm">
            <span>{c.name}</span>
            <span className="text-muted-foreground">age {c.age}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PROGRAM_BADGE_STYLES[c.program_type]}`}>
              {PROGRAM_LABELS[c.program_type]}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {lead.programBookings.map(booking => {
        const groupChildren = lead.children.filter(c => c.program_type === booking.program_type)
        return (
          <div key={booking.booking_id}>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PROGRAM_BADGE_STYLES[booking.program_type]}`}>
                {PROGRAM_LABELS[booking.program_type]}
              </span>
              <span className={`text-xs ${
                booking.status === 'confirmed' ? 'text-green-600 font-medium'
                : booking.status === 'scheduled' ? 'text-green-600'
                : 'text-muted-foreground'
              }`}>
                {formatProgramBookingStatus(booking)}
              </span>
            </div>
            <div className="pl-2 mt-1 flex flex-col gap-0.5">
              {groupChildren.map(c => (
                <span key={c.child_id} className="text-sm text-muted-foreground">
                  {c.name} · age {c.age}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Insert `ChildrenSection` into the lead card JSX**

In the lead card `<div className="p-4 space-y-3">`, add after the contact info row (Row 2) and before the approval timestamp:

```tsx
{/* Children / program bookings */}
{(lead.children?.length > 0 || lead.student_name) && (
  <div className="border-t border-border/50 pt-3">
    <ChildrenSection lead={lead} />
  </div>
)}
```

- [ ] **Step 5: Update action button labels**

In the `lead.status === 'new'` block change `'Approve & Send Invite'` to `'Approve & Send Invites'`.

In the `lead.status === 'approved'` block change `'Resend Booking Link'` to `'Resend Invites'`.

In the `appointment_scheduled`/`appointment_confirmed` block change `'Resend Booking Link'` to `'Resend Invites'`.

- [ ] **Step 6: Build check**

```bash
npm run build
```

- [ ] **Step 7: Smoke test**

Open admin portal → Enrollment Leads. Verify:
- New leads show children grouped by program with booking status
- Legacy leads show the `[legacy]` fallback
- Search by child name works

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/AdminEnrollmentLeadsTab.tsx
git commit -m "feat: show children grouped by program on admin lead card"
```

---

### Task 7: PickDateModal — Per-Program Stacked

**Files:**
- Modify: `src/components/admin/PickDateModal.tsx`
- Modify: `src/components/admin/AdminEnrollmentLeadsTab.tsx` (update `handleBookingConfirm` signature)

- [ ] **Step 1: Rewrite `PickDateModal.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Loader2 } from 'lucide-react'
import { getAppointmentSlots } from '../../lib/supabase/queries'
import { BookingCalendar } from '../shared/BookingCalendar'
import type { EnrollmentLead, AppointmentSlot, EnrollmentLeadProgramBooking } from '../../lib/types'

const PROGRAM_LABELS: Record<string, string> = {
  little_dragons: 'Little Dragons',
  youth: 'Youth Program',
}

const PROGRAM_SECTION_STYLES: Record<string, string> = {
  little_dragons: 'border-purple-200 bg-purple-50/40',
  youth: 'border-blue-200 bg-blue-50/40',
}

const PROGRAM_BADGE_STYLES: Record<string, string> = {
  little_dragons: 'bg-purple-100 text-purple-700',
  youth: 'bg-blue-100 text-blue-700',
}

type ProgramSlotMap = Record<string, AppointmentSlot[]>

type Selection = Record<string, { slotId: string; date: string } | null>

interface PickDateModalProps {
  lead: EnrollmentLead
  onConfirm: (bookings: Array<{ programBookingId: string; slotId: string; appointmentDate: string }>) => Promise<void>
  onCancel: () => void
}

export function PickDateModal({ lead, onConfirm, onCancel }: PickDateModalProps) {
  const [slotMap, setSlotMap] = useState<ProgramSlotMap>({})
  const [fetching, setFetching] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selection, setSelection] = useState<Selection>({})
  const [loading, setLoading] = useState(false)

  const programBookings: EnrollmentLeadProgramBooking[] = lead.programBookings ?? []

  useEffect(() => {
    async function load() {
      try {
        const results = await Promise.all(
          programBookings.map(async (b) => {
            const slots = await getAppointmentSlots(b.program_type)
            return [b.program_type, slots] as const
          })
        )
        setSlotMap(Object.fromEntries(results))
      } catch {
        setFetchError('Failed to load available slots.')
      } finally {
        setFetching(false)
      }
    }
    if (programBookings.length > 0) load()
    else setFetching(false)
  }, [lead.lead_id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleConfirm() {
    const picked = programBookings
      .filter(b => selection[b.booking_id])
      .map(b => ({
        programBookingId: b.booking_id,
        slotId: selection[b.booking_id]!.slotId,
        appointmentDate: selection[b.booking_id]!.date,
      }))
    if (picked.length === 0) return
    setLoading(true)
    try {
      await onConfirm(picked)
    } catch {
      setFetchError('Failed to book appointment(s). Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const anyPicked = programBookings.some(b => !!selection[b.booking_id])

  // Legacy lead fallback — no program bookings
  if (!fetching && programBookings.length === 0) {
    return (
      <Dialog open onOpenChange={open => { if (!open) onCancel() }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Pick appointment date — {lead.parent_name}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This lead has no program bookings. Use the legacy flow or re-submit.</p>
          <DialogFooter><Button variant="ghost" onClick={onCancel}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={open => { if (!open) onCancel() }}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pick appointment dates — {lead.parent_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {fetching ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            programBookings.map(booking => (
              <div
                key={booking.booking_id}
                className={`border rounded-lg p-3 ${PROGRAM_SECTION_STYLES[booking.program_type] ?? 'border-border bg-muted/20'}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PROGRAM_BADGE_STYLES[booking.program_type]}`}>
                    {PROGRAM_LABELS[booking.program_type]}
                  </span>
                  <span className="text-sm font-medium">
                    {lead.children
                      ?.filter(c => c.program_type === booking.program_type)
                      .map(c => c.name)
                      .join(' & ')}
                  </span>
                </div>
                <BookingCalendar
                  slots={slotMap[booking.program_type] ?? []}
                  onConfirm={async (slotId, date) => {
                    setSelection(prev => ({ ...prev, [booking.booking_id]: { slotId, date } }))
                  }}
                  submitting={false}
                  confirmLabel="Select this date"
                  showAutoConfirmBadge={false}
                />
                {selection[booking.booking_id] && (
                  <p className="text-xs text-green-600 font-medium mt-2">
                    ✓ Selected: {new Date(selection[booking.booking_id]!.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            ))
          )}

          {fetchError && <p className="text-sm text-destructive text-center">{fetchError}</p>}
        </div>

        <DialogFooter className="flex gap-2 pt-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!anyPicked || loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirm {Object.values(selection).filter(Boolean).length > 1 ? 'All' : 'Selection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Update `handleBookingConfirm` in `AdminEnrollmentLeadsTab.tsx`**

Replace the existing `handleBookingConfirm` function:

```ts
async function handleBookingConfirm(
  bookings: Array<{ programBookingId: string; slotId: string; appointmentDate: string }>
) {
  const fnHeaders = await edgeFunctionUserAuthHeaders()
  if (!fnHeaders) { toast.error('Session expired. Please sign in again.'); return }

  for (const b of bookings) {
    const { data, error } = await supabase.functions.invoke('admin-book-appointment', {
      body: { programBookingId: b.programBookingId, slotId: b.slotId, appointmentDate: b.appointmentDate },
      headers: fnHeaders,
    })
    if (error || !data) { toast.error('Failed to book appointment'); return }
  }

  // Reload leads to reflect updated statuses
  await load()
  setPickDateTarget(null)
  toast.success('Appointment(s) booked')
}
```

Also update the `PickDateModal` usage to match the new `onConfirm` signature (it now takes the array directly):

```tsx
{pickDateTarget && (
  <PickDateModal
    lead={pickDateTarget}
    onConfirm={handleBookingConfirm}
    onCancel={() => setPickDateTarget(null)}
  />
)}
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/PickDateModal.tsx src/components/admin/AdminEnrollmentLeadsTab.tsx
git commit -m "feat: per-program stacked PickDateModal and updated booking confirm handler"
```

---

### Task 8: AdminAvailabilitySettings — Program Type Field

**Files:**
- Modify: `src/components/admin/AdminAvailabilitySettings.tsx`

- [ ] **Step 1: Add program type to slot form state**

Add state variable after existing slot form state:
```ts
const [slotProgramType, setSlotProgramType] = useState<'little_dragons' | 'youth' | 'all'>('all')
```

When opening the edit form for an existing slot, also set this:
```ts
setSlotProgramType((slot.program_type ?? 'all') as 'little_dragons' | 'youth' | 'all')
```

When resetting the form (after save or cancel), reset it:
```ts
setSlotProgramType('all')
```

- [ ] **Step 2: Add program type dropdown to slot form JSX**

Inside the slot create/edit form, after the `slotLabel` input field, add:

```tsx
<div className="flex flex-col gap-1">
  <Label>Program type</Label>
  <select
    value={slotProgramType}
    onChange={e => setSlotProgramType(e.target.value as 'little_dragons' | 'youth' | 'all')}
    className="border border-border rounded-md px-3 py-2 text-sm bg-background"
  >
    <option value="all">All programs</option>
    <option value="little_dragons">Little Dragons</option>
    <option value="youth">Youth Program</option>
  </select>
</div>
```

- [ ] **Step 3: Include program_type in upsert call**

Find where the slot is saved (upsert call to `appointment_slots`). Add `program_type: slotProgramType` to the upsert object.

- [ ] **Step 4: Show program type in slot list**

In the slot list item, update `slotScheduleLabel` display to append the program label:

```tsx
<span className="text-sm text-muted-foreground">
  {slotScheduleLabel(slot)} · {slot.program_type === 'all' ? 'All programs' : slot.program_type === 'little_dragons' ? 'Little Dragons' : 'Youth Program'}
</span>
```

- [ ] **Step 5: Build check + commit**

```bash
npm run build
git add src/components/admin/AdminAvailabilitySettings.tsx
git commit -m "feat: add program_type field to appointment slot management"
```

---

### Task 9: BookingPage — Token → Program Booking

**Files:**
- Modify: `src/pages/BookingPage.tsx`

- [ ] **Step 1: Replace `BookingPage.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase/client'
import { getProgramBookingByToken, getAppointmentSlots } from '../lib/supabase/queries'
import { BookingCalendar } from '../components/shared/BookingCalendar'
import type { AppointmentSlot } from '../lib/types'

const PROGRAM_LABELS: Record<string, string> = {
  little_dragons: 'Little Dragons',
  youth: 'Youth Program',
}

interface BookingInfo {
  booking_id: string
  program_type: 'little_dragons' | 'youth'
  status: string
  appointment_date: string | null
  appointment_time: string | null
  parent_name: string
  child_names: string[]
}

export function BookingPage() {
  const { token } = useParams<{ token: string }>()
  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<AppointmentSlot[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [booked, setBooked] = useState<{ date: string; time: string } | null>(null)
  const [showReschedule, setShowReschedule] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setError('Invalid link'); setLoading(false); return }
    getProgramBookingByToken(token).then(data => {
      if (!data) { setError('This booking link is no longer valid.'); setLoading(false); return }
      setBooking(data as BookingInfo)
      if (['scheduled', 'confirmed'].includes(data.status) && data.appointment_date) {
        setBooked({ date: data.appointment_date, time: data.appointment_time ?? '' })
      }
      setLoading(false)
    })
  }, [token])

  useEffect(() => {
    if (!booking || !['pending', 'link_sent', 'scheduled', 'confirmed'].includes(booking.status)) return
    getAppointmentSlots(booking.program_type)
      .then(setSlots)
      .catch(() => setError('Failed to load available dates. Please refresh.'))
  }, [booking])

  async function handleBook(slotId: string, date: string) {
    if (!token) return
    setSubmitting(true)
    try {
      setError(null)
      const { data, error: fnError } = await supabase.functions.invoke('book-appointment', {
        body: { token, slotId, appointmentDate: date },
      })
      if (fnError) throw fnError
      setBooked({ date: data.appointment_date, time: data.appointment_time })
      setBooking(prev => prev ? { ...prev, status: data.status, appointment_date: data.appointment_date, appointment_time: data.appointment_time } : prev)
      setShowReschedule(false)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const programLabel = booking ? PROGRAM_LABELS[booking.program_type] ?? booking.program_type : ''
  const childList = booking?.child_names.join(' & ') ?? ''

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-semibold mb-2">Link unavailable</h1>
          <p className="text-muted-foreground text-sm">{error ?? 'This booking link is no longer valid.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-1">Los Banos Martial Arts Academy</p>
          <h1 className="text-2xl font-bold">Book your {programLabel} intro</h1>
          {childList && <p className="text-muted-foreground mt-1">for {childList}</p>}
        </div>

        {booked && !showReschedule ? (
          <div className="border border-border rounded-xl p-6 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your appointment</p>
              <p className="text-xl font-semibold">
                {new Date(booked.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              {booked.time && (
                <p className="text-muted-foreground">
                  {new Date('1970-01-01T' + booked.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowReschedule(true)}
              className="text-sm text-primary hover:underline"
            >
              Need to reschedule?
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {showReschedule && (
              <button onClick={() => setShowReschedule(false)} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
            )}
            <BookingCalendar
              slots={slots}
              onConfirm={handleBook}
              submitting={submitting}
              confirmLabel="Confirm Appointment"
              showAutoConfirmBadge
            />
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/BookingPage.tsx
git commit -m "feat: BookingPage resolves per-program booking token with program-typed slots"
```

---

### Task 10: Email Template + `approve-enrollment-lead`

**Files:**
- Modify: `supabase/functions/send-email/templates.ts`
- Modify: `supabase/functions/approve-enrollment-lead/index.ts`

- [ ] **Step 1: Add `multiProgramApprovalEmailHtml` to `templates.ts`**

At the end of `templates.ts`, add:

```ts
export function multiProgramApprovalEmailHtml(
  parentName: string,
  bookingLinks: Array<{ programLabel: string; childNames: string[]; url: string }>
): string {
  const linksHtml = bookingLinks.map(b => {
    const names = b.childNames.join(' & ')
    return `
      <div style="margin-bottom:20px;">
        <div style="font-weight:700;color:#1a1a2e;margin-bottom:8px;font-size:13px;">${b.programLabel}${names ? ` — ${names}` : ''}</div>
        ${ctaButton(b.url, `Book ${b.programLabel} Appointment`)}
      </div>
    `
  }).join('')

  return wrap(`
    <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1a1a2e;">Your enrollment request has been approved!</p>
    <p style="margin:0 0 18px;color:#555;font-size:13px;line-height:1.65;">
      Hi ${parentName}! We'd love to welcome your family to Los Banos Martial Arts Academy.
      Use the links below to choose an appointment date for each program.
    </p>
    ${linksHtml}
    <p style="margin:0 0 18px;font-size:12px;color:#aaa;text-align:center;">
      These booking links are unique to your inquiry. Do not share them.
    </p>
  `)
}
```

- [ ] **Step 2: Rewrite `approve-enrollment-lead/index.ts`**

```ts
// supabase/functions/approve-enrollment-lead/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { multiProgramApprovalEmailHtml } from '../send-email/templates.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROGRAM_LABELS: Record<string, string> = {
  little_dragons: 'Little Dragons',
  youth: 'Youth Program',
}

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS })

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
  )
  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS })

  const supabase = adminClient()
  const { data: isAdmin } = await supabase.rpc('is_admin', { user_uuid: user.id })
  if (!isAdmin) return new Response('Forbidden', { status: 403, headers: CORS_HEADERS })

  const { leadId } = await req.json()
  if (!leadId) return new Response('Missing leadId', { status: 400, headers: CORS_HEADERS })

  const { data: lead } = await supabase
    .from('enrollment_leads')
    .select('lead_id, status, parent_name, parent_email')
    .eq('lead_id', leadId)
    .single()

  if (!lead) return new Response('Lead not found', { status: 404, headers: CORS_HEADERS })

  // Fetch program bookings for this lead
  const { data: programBookings, error: pbError } = await supabase
    .from('enrollment_lead_program_bookings')
    .select('booking_id, program_type, booking_token, status')
    .eq('lead_id', leadId)

  if (pbError || !programBookings?.length) {
    return new Response('No program bookings found for this lead', { status: 422, headers: CORS_HEADERS })
  }

  // Generate tokens for bookings that don't have one yet
  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://lbmaa.com'

  for (const pb of programBookings) {
    if (!pb.booking_token) {
      const token = crypto.randomUUID()
      const { error: updateError } = await supabase
        .from('enrollment_lead_program_bookings')
        .update({ booking_token: token, status: 'link_sent' })
        .eq('booking_id', pb.booking_id)
      if (updateError) {
        console.error('[approve] token update error:', updateError)
        return new Response('Failed to assign booking token', { status: 500, headers: CORS_HEADERS })
      }
      pb.booking_token = token
    } else if (pb.status === 'pending') {
      await supabase
        .from('enrollment_lead_program_bookings')
        .update({ status: 'link_sent' })
        .eq('booking_id', pb.booking_id)
    }
  }

  // Fetch children for each program group
  const { data: children } = await supabase
    .from('enrollment_lead_children')
    .select('name, program_type')
    .eq('lead_id', leadId)
    .order('created_at')

  const bookingLinks = programBookings.map(pb => ({
    programLabel: PROGRAM_LABELS[pb.program_type] ?? pb.program_type,
    childNames: (children ?? [])
      .filter(c => c.program_type === pb.program_type)
      .map(c => c.name),
    url: `${siteUrl}/book/${pb.booking_token}`,
  }))

  // Update lead status
  const { error: leadUpdateError } = await supabase
    .from('enrollment_leads')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('lead_id', leadId)

  if (leadUpdateError) {
    console.error('[approve] lead update error:', leadUpdateError)
    return new Response('Lead update failed', { status: 500, headers: CORS_HEADERS })
  }

  // Queue approval email notification
  const { error: notifError } = await supabase
    .from('enrollment_lead_notifications')
    .insert({
      lead_id: leadId,
      recipient_email: lead.parent_email,
      channel: 'email',
      type: 'approval',
      status: 'queued',
    })

  if (notifError) {
    console.error('[approve] notification insert error:', notifError)
    return new Response('Notification failed', { status: 500, headers: CORS_HEADERS })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
})
```

Note: The `send-email` function reads the notification queue and sends the email using the stored template. You must ensure the `send-email` function uses `multiProgramApprovalEmailHtml` when `type = 'approval'` and the lead has program bookings. Check `send-email/index.ts` and update the `approval` case to fetch program bookings and use the new template when they exist; fall back to `approvalEmailHtml` for legacy leads.

- [ ] **Step 3: Deploy both edge functions**

Use `mcp__supabase__deploy_edge_function` for `approve-enrollment-lead` and `send-email`.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/approve-enrollment-lead/index.ts supabase/functions/send-email/templates.ts
git commit -m "feat: approve-enrollment-lead generates per-program tokens and sends multi-link email"
```

---

### Task 11: `book-appointment` and `admin-book-appointment`

**Files:**
- Modify: `supabase/functions/book-appointment/index.ts`
- Modify: `supabase/functions/admin-book-appointment/index.ts`

Helper used in both (inline in each function — do not share across functions):

```ts
async function recalculateLeadStatus(supabase: ReturnType<typeof createClient>, leadId: string) {
  const { data: bookings } = await supabase
    .from('enrollment_lead_program_bookings')
    .select('status')
    .eq('lead_id', leadId)

  if (!bookings?.length) return

  const statuses = bookings.map((b: { status: string }) => b.status)
  let newStatus: string
  if (statuses.every((s: string) => s === 'confirmed')) newStatus = 'appointment_confirmed'
  else if (statuses.some((s: string) => s === 'scheduled' || s === 'confirmed')) newStatus = 'appointment_scheduled'
  else newStatus = 'approved'

  await supabase.from('enrollment_leads').update({ status: newStatus }).eq('lead_id', leadId)
}
```

- [ ] **Step 1: Rewrite `book-appointment/index.ts`**

```ts
// supabase/functions/book-appointment/index.ts
// Public endpoint — auth is the booking_token (resolves to program booking).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )
}

async function recalculateLeadStatus(supabase: ReturnType<typeof createClient>, leadId: string) {
  const { data: bookings } = await supabase
    .from('enrollment_lead_program_bookings')
    .select('status')
    .eq('lead_id', leadId)
  if (!bookings?.length) return
  const statuses = bookings.map((b: { status: string }) => b.status)
  let newStatus: string
  if (statuses.every((s: string) => s === 'confirmed')) newStatus = 'appointment_confirmed'
  else if (statuses.some((s: string) => s === 'scheduled' || s === 'confirmed')) newStatus = 'appointment_scheduled'
  else newStatus = 'approved'
  await supabase.from('enrollment_leads').update({ status: newStatus }).eq('lead_id', leadId)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { token, slotId, appointmentDate } = await req.json()
  if (!token || !slotId || !appointmentDate) {
    return new Response('Missing token, slotId, or appointmentDate', { status: 400, headers: CORS_HEADERS })
  }

  const supabase = adminClient()

  const { data: pb } = await supabase
    .from('enrollment_lead_program_bookings')
    .select('booking_id, lead_id, status, program_type')
    .eq('booking_token', token)
    .single()

  if (!pb) return new Response('Invalid booking token', { status: 404, headers: CORS_HEADERS })
  if (!['pending','link_sent','scheduled','confirmed'].includes(pb.status)) {
    return new Response('This booking link is no longer valid', { status: 422, headers: CORS_HEADERS })
  }

  const { data: slot } = await supabase
    .from('appointment_slots')
    .select('slot_id, start_time, day_of_week, is_active')
    .eq('slot_id', slotId)
    .eq('is_active', true)
    .single()

  if (!slot) return new Response('Slot not found or inactive', { status: 404, headers: CORS_HEADERS })

  const targetDate = new Date(appointmentDate + 'T12:00:00')
  if (targetDate.getDay() !== slot.day_of_week) {
    return new Response('Appointment date does not match slot day', { status: 422, headers: CORS_HEADERS })
  }

  const { data: override } = await supabase
    .from('appointment_slot_overrides')
    .select('override_id')
    .eq('slot_id', slotId)
    .eq('override_date', appointmentDate)
    .maybeSingle()

  if (override) return new Response('This date is not available', { status: 422, headers: CORS_HEADERS })

  const nowUtc = new Date()
  const todayUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate()))
  const daysUntil = Math.floor((targetDate.getTime() - todayUtc.getTime()) / (1000 * 60 * 60 * 24))
  const newStatus = daysUntil < 2 ? 'confirmed' : 'scheduled'

  const { error: pbError } = await supabase
    .from('enrollment_lead_program_bookings')
    .update({
      appointment_date: appointmentDate,
      appointment_time: slot.start_time,
      appointment_slot_id: slotId,
      status: newStatus,
    })
    .eq('booking_id', pb.booking_id)

  if (pbError) return new Response('Booking failed', { status: 500, headers: CORS_HEADERS })

  await recalculateLeadStatus(supabase, pb.lead_id)

  const { data: lead } = await supabase
    .from('enrollment_leads')
    .select('parent_email, lead_id')
    .eq('lead_id', pb.lead_id)
    .single()

  if (lead) {
    await supabase.from('enrollment_lead_notifications').insert({
      lead_id: lead.lead_id,
      recipient_email: lead.parent_email,
      channel: 'email',
      type: 'booking_confirmation',
      status: 'queued',
    })
  }

  return new Response(
    JSON.stringify({ ok: true, status: newStatus, appointment_date: appointmentDate, appointment_time: slot.start_time }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  )
})
```

- [ ] **Step 2: Rewrite `admin-book-appointment/index.ts`**

```ts
// supabase/functions/admin-book-appointment/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )
}

async function recalculateLeadStatus(supabase: ReturnType<typeof createClient>, leadId: string) {
  const { data: bookings } = await supabase
    .from('enrollment_lead_program_bookings')
    .select('status')
    .eq('lead_id', leadId)
  if (!bookings?.length) return
  const statuses = bookings.map((b: { status: string }) => b.status)
  let newStatus: string
  if (statuses.every((s: string) => s === 'confirmed')) newStatus = 'appointment_confirmed'
  else if (statuses.some((s: string) => s === 'scheduled' || s === 'confirmed')) newStatus = 'appointment_scheduled'
  else newStatus = 'approved'
  await supabase.from('enrollment_leads').update({ status: newStatus }).eq('lead_id', leadId)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS })

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
  )
  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS })

  const supabase = adminClient()
  const { data: isAdmin } = await supabase.rpc('is_admin', { user_uuid: user.id })
  if (!isAdmin) return new Response('Forbidden', { status: 403, headers: CORS_HEADERS })

  const { programBookingId, slotId, appointmentDate } = await req.json()
  if (!programBookingId || !slotId || !appointmentDate) {
    return new Response('Missing programBookingId, slotId, or appointmentDate', { status: 400, headers: CORS_HEADERS })
  }

  const { data: pb } = await supabase
    .from('enrollment_lead_program_bookings')
    .select('booking_id, lead_id, status')
    .eq('booking_id', programBookingId)
    .single()

  if (!pb) return new Response('Program booking not found', { status: 404, headers: CORS_HEADERS })

  const { data: slot } = await supabase
    .from('appointment_slots')
    .select('slot_id, start_time, day_of_week, is_active')
    .eq('slot_id', slotId)
    .eq('is_active', true)
    .single()

  if (!slot) return new Response('Slot not found or inactive', { status: 404, headers: CORS_HEADERS })

  const targetDate = new Date(appointmentDate + 'T12:00:00')
  if (targetDate.getDay() !== slot.day_of_week) {
    return new Response('Appointment date does not match slot day', { status: 422, headers: CORS_HEADERS })
  }

  const { data: override } = await supabase
    .from('appointment_slot_overrides')
    .select('override_id')
    .eq('slot_id', slotId)
    .eq('override_date', appointmentDate)
    .maybeSingle()

  if (override) return new Response('This date is blocked', { status: 422, headers: CORS_HEADERS })

  const nowUtc = new Date()
  const todayUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate()))
  const daysUntil = Math.floor((targetDate.getTime() - todayUtc.getTime()) / (1000 * 60 * 60 * 24))
  const newStatus = daysUntil < 2 ? 'confirmed' : 'scheduled'

  const { error: updateError } = await supabase
    .from('enrollment_lead_program_bookings')
    .update({
      appointment_date: appointmentDate,
      appointment_time: slot.start_time,
      appointment_slot_id: slotId,
      status: newStatus,
    })
    .eq('booking_id', programBookingId)

  if (updateError) return new Response('Booking failed', { status: 500, headers: CORS_HEADERS })

  await recalculateLeadStatus(supabase, pb.lead_id)

  const { data: lead } = await supabase
    .from('enrollment_leads')
    .select('parent_email, lead_id')
    .eq('lead_id', pb.lead_id)
    .single()

  if (lead) {
    await supabase.from('enrollment_lead_notifications').insert({
      lead_id: lead.lead_id,
      recipient_email: lead.parent_email,
      channel: 'email',
      type: 'booking_confirmation',
      status: 'queued',
    })
  }

  return new Response(
    JSON.stringify({ ok: true, status: newStatus, appointment_date: appointmentDate, appointment_time: slot.start_time }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  )
})
```

- [ ] **Step 3: Deploy both edge functions**

Use `mcp__supabase__deploy_edge_function` for `book-appointment` and `admin-book-appointment`.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/book-appointment/index.ts supabase/functions/admin-book-appointment/index.ts
git commit -m "feat: book-appointment and admin-book-appointment use program booking rows"
```

---

### Task 12: `resend-booking-link` and `confirm-appointment`

**Files:**
- Modify: `supabase/functions/resend-booking-link/index.ts`
- Modify: `supabase/functions/confirm-appointment/index.ts`

- [ ] **Step 1: Rewrite `resend-booking-link/index.ts`**

```ts
// supabase/functions/resend-booking-link/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS })

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
  )
  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS })

  const supabase = adminClient()
  const { data: isAdmin } = await supabase.rpc('is_admin', { user_uuid: user.id })
  if (!isAdmin) return new Response('Forbidden', { status: 403, headers: CORS_HEADERS })

  const { leadId } = await req.json()
  if (!leadId) return new Response('Missing leadId', { status: 400, headers: CORS_HEADERS })

  const { data: lead } = await supabase
    .from('enrollment_leads')
    .select('lead_id, status, parent_email')
    .eq('lead_id', leadId)
    .single()

  if (!lead) return new Response('Lead not found', { status: 404, headers: CORS_HEADERS })

  // Only resend for program bookings not yet scheduled
  const { data: pendingBookings } = await supabase
    .from('enrollment_lead_program_bookings')
    .select('booking_id, status, booking_token')
    .eq('lead_id', leadId)
    .in('status', ['pending', 'link_sent'])

  if (!pendingBookings?.length) {
    return new Response('No unbooked program bookings to resend', { status: 422, headers: CORS_HEADERS })
  }

  const { error: notifError } = await supabase
    .from('enrollment_lead_notifications')
    .insert({
      lead_id: leadId,
      recipient_email: lead.parent_email,
      channel: 'email',
      type: 'approval',
      status: 'queued',
    })

  if (notifError) return new Response('Notification failed', { status: 500, headers: CORS_HEADERS })

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
})
```

- [ ] **Step 2: Rewrite `confirm-appointment/index.ts`**

```ts
// supabase/functions/confirm-appointment/index.ts
// Public endpoint — auth is the booking_token.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )
}

async function recalculateLeadStatus(supabase: ReturnType<typeof createClient>, leadId: string) {
  const { data: bookings } = await supabase
    .from('enrollment_lead_program_bookings')
    .select('status')
    .eq('lead_id', leadId)
  if (!bookings?.length) return
  const statuses = bookings.map((b: { status: string }) => b.status)
  let newStatus: string
  if (statuses.every((s: string) => s === 'confirmed')) newStatus = 'appointment_confirmed'
  else if (statuses.some((s: string) => s === 'scheduled' || s === 'confirmed')) newStatus = 'appointment_scheduled'
  else newStatus = 'approved'
  await supabase.from('enrollment_leads').update({ status: newStatus }).eq('lead_id', leadId)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { token } = await req.json()
  if (!token) return new Response('Missing token', { status: 400, headers: CORS_HEADERS })

  const supabase = adminClient()

  const { data: pb } = await supabase
    .from('enrollment_lead_program_bookings')
    .select('booking_id, lead_id, status, appointment_date, appointment_time')
    .eq('booking_token', token)
    .single()

  if (!pb) return new Response('Invalid token', { status: 404, headers: CORS_HEADERS })

  if (pb.status === 'confirmed') {
    return new Response(
      JSON.stringify({ ok: true, already_confirmed: true, appointment_date: pb.appointment_date, appointment_time: pb.appointment_time }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  if (pb.status !== 'scheduled') {
    return new Response('Cannot confirm from current status', { status: 422, headers: CORS_HEADERS })
  }

  const { error } = await supabase
    .from('enrollment_lead_program_bookings')
    .update({ status: 'confirmed' })
    .eq('booking_id', pb.booking_id)

  if (error) return new Response('Confirmation failed', { status: 500, headers: CORS_HEADERS })

  await recalculateLeadStatus(supabase, pb.lead_id)

  return new Response(
    JSON.stringify({ ok: true, already_confirmed: false, appointment_date: pb.appointment_date, appointment_time: pb.appointment_time }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  )
})
```

- [ ] **Step 3: Deploy both edge functions**

Use `mcp__supabase__deploy_edge_function` for `resend-booking-link` and `confirm-appointment`.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/resend-booking-link/index.ts supabase/functions/confirm-appointment/index.ts
git commit -m "feat: resend-booking-link and confirm-appointment use program booking rows"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| Public form multi-child | Task 4 |
| Age validation 4–17 | Task 4 |
| `enrollment_lead_children` table | Task 1 |
| `enrollment_lead_program_bookings` table | Task 1 |
| `appointment_slots.program_type` | Task 1 |
| Booked-date exclusion | Task 1 (updated RPC) |
| `submit_enrollment_lead` RPC | Task 1 |
| `create_enrollment_lead` RPC | Task 1 |
| `get_program_booking_by_token` RPC | Task 1 |
| TypeScript types | Task 2 |
| `getEnrollmentLeads` with join | Task 3 |
| `getAppointmentSlots` program filter | Task 3 |
| `getProgramBookingByToken` | Task 3 |
| `submitEnrollmentLeadWithTimeout` | Task 3 |
| `createEnrollmentLead` | Task 3 |
| Children section on lead card | Task 6 |
| Lead status aggregation | Task 6 |
| Action button label updates | Task 6 |
| Search by child name | Task 6 |
| PickDateModal per-program stacked | Task 7 |
| AdminAvailabilitySettings program_type | Task 8 |
| BookingPage per-program token | Task 9 |
| approve-enrollment-lead | Task 10 |
| Multi-program approval email template | Task 10 |
| book-appointment | Task 11 |
| admin-book-appointment | Task 11 |
| resend-booking-link | Task 12 |
| confirm-appointment | Task 12 |
| NewLeadModal multi-child | Task 5 |
| Legacy lead backward compat | Tasks 3, 6 |

All spec requirements are covered. No gaps found.
