# Family Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-screen `FirstLoginOnboarding` with a 3-step wizard that collects primary guardian info, children, and an optional home address.

**Architecture:** Wizard shell `FamilyOnboarding.tsx` holds all state and fires all DB writes in sequence at the end. Three stateless sub-components (`GuardianStep`, `ChildrenStep`, `AddressStep`) receive their slice of state and callbacks. A done screen renders inline in the shell after a successful submit.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui (`Button`, `Input`, `Label`, `Alert`), Lucide icons, existing Supabase mutation helpers.

---

## File Map

| Action | Path |
|--------|------|
| Create | `src/components/onboarding/FamilyOnboarding.tsx` |
| Create | `src/components/onboarding/GuardianStep.tsx` |
| Create | `src/components/onboarding/ChildrenStep.tsx` |
| Create | `src/components/onboarding/AddressStep.tsx` |
| Modify | `src/App.tsx` (update import + component name) |
| Delete | `src/components/FirstLoginOnboarding.tsx` |

---

## Task 1: Scaffold `FamilyOnboarding.tsx` — shell with state, header, progress bar

**Files:**
- Create: `src/components/onboarding/FamilyOnboarding.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/onboarding/FamilyOnboarding.tsx
import { useState } from 'react'
import type { Relationship } from '../../lib/types'

export type GuardianForm = {
  firstName: string
  lastName: string
  phone: string
  relationship: Relationship | ''
}

export type ChildForm = {
  id: string
  firstName: string
  lastName: string
  dob: string
}

export type AddressForm = {
  street: string
  city: string
  state: string
  zip: string
}

type User = {
  id: string
  email: string
  role: 'admin' | 'family'
  displayName: string
}

interface FamilyOnboardingProps {
  user: User
  onComplete: () => void | Promise<void>
  onLogout: () => Promise<void>
}

const PROGRESS: Record<1 | 2 | 3, number> = { 1: 33, 2: 66, 3: 90 }

export function FamilyOnboarding({ user, onComplete, onLogout }: FamilyOnboardingProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 'done'>(1)
  const [guardian, setGuardian] = useState<GuardianForm>({
    firstName: '', lastName: '', phone: '', relationship: '',
  })
  const [children, setChildren] = useState<ChildForm[]>([
    { id: crypto.randomUUID(), firstName: '', lastName: '', dob: '' },
  ])
  const [address, setAddress] = useState<AddressForm>({
    street: '', city: '', state: 'CA', zip: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedData, setSavedData] = useState<{
    guardianName: string
    childNames: string[]
    hasAddress: boolean
  } | null>(null)

  const progressPct = step === 'done' ? 100 : PROGRESS[step as 1 | 2 | 3]

  return (
    <div className="min-h-screen bg-background">
      {/* Brand header */}
      <div className="bg-foreground px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span
              className="text-primary-foreground text-xs font-bold leading-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              LB
            </span>
          </div>
          <div>
            <p
              className="text-sm font-semibold text-primary-foreground leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              LBMAA Family Portal
            </p>
            <p className="text-[11px] text-primary-foreground/40 leading-tight">
              Los Banos Martial Arts Academy
            </p>
          </div>
        </div>
        <button
          className="text-xs text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors"
          onClick={() => void onLogout()}
        >
          Sign out
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] bg-muted w-full">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step area */}
      <div className="flex justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {step === 1 && <div className="text-muted-foreground text-sm">Step 1 placeholder</div>}
          {step === 2 && <div className="text-muted-foreground text-sm">Step 2 placeholder</div>}
          {step === 3 && <div className="text-muted-foreground text-sm">Step 3 placeholder</div>}
          {step === 'done' && <div className="text-muted-foreground text-sm">Done placeholder</div>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Start dev server and verify the shell renders**

Run: `npm run dev`

Navigate to `/onboarding` (you may need to be logged in as a family user with no family record, or temporarily swap the `/onboarding` route in App.tsx to render `<FamilyOnboarding>` directly).

Expected: Page with dark brand header, red progress bar at ~33%, "Step 1 placeholder" text.

- [ ] **Step 3: Update App.tsx import to point at the new component**

In `src/App.tsx`, change line 3:

```tsx
// Before:
import { FirstLoginOnboarding } from './components/FirstLoginOnboarding';

// After:
import { FamilyOnboarding } from './components/onboarding/FamilyOnboarding';
```

Change line 123:

```tsx
// Before:
<FirstLoginOnboarding user={user} onComplete={async () => {

// After:
<FamilyOnboarding user={user} onComplete={async () => {
```

- [ ] **Step 4: Verify no TypeScript errors**

Run: `npm run build`

Expected: Build succeeds. (The `onLogout` prop is present on `FamilyOnboarding` — it matches what `App.tsx` passes.)

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/FamilyOnboarding.tsx src/App.tsx
git commit -m "feat: scaffold FamilyOnboarding wizard shell with header and progress bar"
```

---

## Task 2: Build `GuardianStep.tsx` — step 1 form

**Files:**
- Create: `src/components/onboarding/GuardianStep.tsx`
- Modify: `src/components/onboarding/FamilyOnboarding.tsx` (replace step 1 placeholder)

- [ ] **Step 1: Create the component**

```tsx
// src/components/onboarding/GuardianStep.tsx
import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { ArrowRight } from 'lucide-react'
import type { GuardianForm } from './FamilyOnboarding'

interface GuardianStepProps {
  email: string
  values: GuardianForm
  onChange: (updates: Partial<GuardianForm>) => void
  onNext: () => void
}

const RELATIONSHIP_OPTIONS = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'other', label: 'Other' },
]

export function GuardianStep({ email, values, onChange, onNext }: GuardianStepProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const errors = {
    firstName: !values.firstName.trim() ? 'First name is required' : null,
    lastName: !values.lastName.trim() ? 'Last name is required' : null,
    phone: !values.phone.trim() ? 'Phone number is required' : null,
  }

  function handleNext() {
    setTouched({ firstName: true, lastName: true, phone: true })
    if (!errors.firstName && !errors.lastName && !errors.phone) onNext()
  }

  return (
    <div>
      <p
        className="text-xs font-semibold tracking-wider uppercase text-primary mb-1"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Step 1 of 3
      </p>
      <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
        About You
      </h2>
      <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
        Tell us about the primary parent or guardian so the school can reach you.
      </p>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ob-email">Email address</Label>
          <Input id="ob-email" value={email} disabled className="bg-muted text-muted-foreground" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ob-firstName">First name</Label>
            <Input
              id="ob-firstName"
              value={values.firstName}
              onChange={e => onChange({ firstName: e.target.value })}
              onBlur={() => setTouched(t => ({ ...t, firstName: true }))}
              autoComplete="given-name"
            />
            {touched.firstName && errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-lastName">Last name</Label>
            <Input
              id="ob-lastName"
              value={values.lastName}
              onChange={e => onChange({ lastName: e.target.value })}
              onBlur={() => setTouched(t => ({ ...t, lastName: true }))}
              autoComplete="family-name"
            />
            {touched.lastName && errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ob-phone">Phone number</Label>
          <Input
            id="ob-phone"
            type="tel"
            placeholder="(209) 555-0100"
            value={values.phone}
            onChange={e => onChange({ phone: e.target.value })}
            onBlur={() => setTouched(t => ({ ...t, phone: true }))}
            autoComplete="tel"
          />
          {touched.phone && errors.phone && (
            <p className="text-xs text-destructive">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ob-relationship">
            You are the child&apos;s{' '}
            <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </Label>
          <select
            id="ob-relationship"
            value={values.relationship}
            onChange={e => onChange({ relationship: e.target.value as GuardianForm['relationship'] })}
            className="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select relationship…</option>
            {RELATIONSHIP_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8">
        <Button onClick={handleNext} className="w-full">
          Next: Your Children
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire step 1 into the shell**

In `src/components/onboarding/FamilyOnboarding.tsx`, add the import and replace the step 1 placeholder:

```tsx
// Add import at top (after existing imports):
import { GuardianStep } from './GuardianStep'
```

Replace `{step === 1 && <div ...>Step 1 placeholder</div>}` with:

```tsx
{step === 1 && (
  <GuardianStep
    email={user.email}
    values={guardian}
    onChange={updates => setGuardian(g => ({ ...g, ...updates }))}
    onNext={() => setStep(2)}
  />
)}
```

- [ ] **Step 3: Verify step 1 in browser**

Expected:
- Email field pre-filled and greyed out
- Empty first/last/phone fields
- Clicking "Next: Your Children" with empty fields shows inline error messages under each required field
- Filling all three fields and clicking Next advances the progress bar to ~66% and shows "Step 2 placeholder"

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding/GuardianStep.tsx src/components/onboarding/FamilyOnboarding.tsx
git commit -m "feat: add GuardianStep — step 1 of family onboarding wizard"
```

---

## Task 3: Build `ChildrenStep.tsx` — step 2, dynamic child cards

**Files:**
- Create: `src/components/onboarding/ChildrenStep.tsx`
- Modify: `src/components/onboarding/FamilyOnboarding.tsx` (replace step 2 placeholder)

- [ ] **Step 1: Create the component**

```tsx
// src/components/onboarding/ChildrenStep.tsx
import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { ArrowRight, ArrowLeft, X, Plus } from 'lucide-react'
import type { ChildForm } from './FamilyOnboarding'

interface ChildrenStepProps {
  values: ChildForm[]
  onChange: (children: ChildForm[]) => void
  onNext: () => void
  onBack: () => void
}

function isValidDob(dob: string): boolean {
  if (!dob) return false
  const d = new Date(dob)
  return !isNaN(d.getTime()) && d < new Date()
}

function isValidChild(child: ChildForm): boolean {
  return (
    child.firstName.trim() !== '' &&
    child.lastName.trim() !== '' &&
    isValidDob(child.dob)
  )
}

export function ChildrenStep({ values, onChange, onNext, onBack }: ChildrenStepProps) {
  const [showErrors, setShowErrors] = useState(false)

  function updateChild(id: string, updates: Partial<ChildForm>) {
    onChange(values.map(c => (c.id === id ? { ...c, ...updates } : c)))
  }

  function addChild() {
    onChange([
      ...values,
      { id: crypto.randomUUID(), firstName: '', lastName: '', dob: '' },
    ])
  }

  function removeChild(id: string) {
    if (values.length <= 1) return
    onChange(values.filter(c => c.id !== id))
  }

  function handleNext() {
    setShowErrors(true)
    if (values.every(isValidChild)) onNext()
  }

  return (
    <div>
      <p
        className="text-xs font-semibold tracking-wider uppercase text-primary mb-1"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Step 2 of 3
      </p>
      <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
        Your Children
      </h2>
      <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
        Add the kids who will be training. You can always update this later.
      </p>

      <div className="space-y-3 mb-3">
        {values.map((child, index) => (
          <div
            key={child.id}
            className="bg-secondary rounded-xl p-4 border border-secondary-foreground/10"
          >
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-xs font-bold tracking-wider uppercase text-primary"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Child {index + 1}
              </p>
              {values.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeChild(child.id)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor={`ob-fn-${child.id}`} className="text-xs">First name</Label>
                  <Input
                    id={`ob-fn-${child.id}`}
                    value={child.firstName}
                    onChange={e => updateChild(child.id, { firstName: e.target.value })}
                    className="h-9 text-sm"
                  />
                  {showErrors && !child.firstName.trim() && (
                    <p className="text-xs text-destructive">Required</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`ob-ln-${child.id}`} className="text-xs">Last name</Label>
                  <Input
                    id={`ob-ln-${child.id}`}
                    value={child.lastName}
                    onChange={e => updateChild(child.id, { lastName: e.target.value })}
                    className="h-9 text-sm"
                  />
                  {showErrors && !child.lastName.trim() && (
                    <p className="text-xs text-destructive">Required</p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`ob-dob-${child.id}`} className="text-xs">Date of birth</Label>
                <Input
                  id={`ob-dob-${child.id}`}
                  type="date"
                  value={child.dob}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => updateChild(child.id, { dob: e.target.value })}
                  className="h-9 text-sm"
                />
                {showErrors && !isValidDob(child.dob) && (
                  <p className="text-xs text-destructive">Valid date of birth required</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addChild}
        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-primary border-2 border-dashed border-primary/30 rounded-lg py-2.5 hover:border-primary/50 hover:bg-secondary/50 transition-colors mb-8"
      >
        <Plus className="w-4 h-4" /> Add another child
      </button>

      <div className="space-y-2">
        <Button onClick={handleNext} className="w-full">
          Next: Home Address
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
        <Button variant="ghost" onClick={onBack} className="w-full text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire step 2 into the shell**

In `src/components/onboarding/FamilyOnboarding.tsx`, add the import and replace the step 2 placeholder:

```tsx
// Add import:
import { ChildrenStep } from './ChildrenStep'
```

Replace `{step === 2 && <div ...>Step 2 placeholder</div>}` with:

```tsx
{step === 2 && (
  <ChildrenStep
    values={children}
    onChange={setChildren}
    onNext={() => setStep(3)}
    onBack={() => setStep(1)}
  />
)}
```

- [ ] **Step 3: Verify step 2 in browser**

Navigate through step 1 to reach step 2.

Expected:
- One child card visible with rose/pink background
- Clicking "Next: Home Address" with empty fields shows "Required" and "Valid date of birth required" messages
- "Add another child" appends a second card with a "Remove" button
- Removing a child works; the first card never shows "Remove"
- Filling all fields and clicking Next advances to "Step 3 placeholder"
- "Back" returns to step 1 with guardian data intact

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding/ChildrenStep.tsx src/components/onboarding/FamilyOnboarding.tsx
git commit -m "feat: add ChildrenStep — step 2 of family onboarding wizard"
```

---

## Task 4: Build `AddressStep.tsx` — step 3, optional address + submit owner

**Files:**
- Create: `src/components/onboarding/AddressStep.tsx`
- Modify: `src/components/onboarding/FamilyOnboarding.tsx` (replace step 3 placeholder)

- [ ] **Step 1: Create the component**

```tsx
// src/components/onboarding/AddressStep.tsx
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { AlertCircle, ArrowLeft, Check, Loader2 } from 'lucide-react'
import type { AddressForm } from './FamilyOnboarding'

interface AddressStepProps {
  values: AddressForm
  onChange: (updates: Partial<AddressForm>) => void
  onFinish: () => void
  onSkip: () => void
  onBack: () => void
  submitting: boolean
  error: string | null
}

export function AddressStep({
  values,
  onChange,
  onFinish,
  onSkip,
  onBack,
  submitting,
  error,
}: AddressStepProps) {
  return (
    <div>
      <p
        className="text-xs font-semibold tracking-wider uppercase text-primary mb-1"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Step 3 of 3
      </p>
      <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
        Home Address
      </h2>
      <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
        Used for school records only. You can skip this and add it later from your profile.
      </p>

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ob-street">Street address</Label>
          <Input
            id="ob-street"
            placeholder="123 Main St"
            value={values.street}
            onChange={e => onChange({ street: e.target.value })}
            disabled={submitting}
            autoComplete="street-address"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ob-city">City</Label>
          <Input
            id="ob-city"
            placeholder="Los Banos"
            value={values.city}
            onChange={e => onChange({ city: e.target.value })}
            disabled={submitting}
            autoComplete="address-level2"
          />
        </div>
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ob-state">State</Label>
            <Input
              id="ob-state"
              value={values.state}
              onChange={e => onChange({ state: e.target.value })}
              disabled={submitting}
              autoComplete="address-level1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-zip">ZIP code</Label>
            <Input
              id="ob-zip"
              placeholder="93635"
              value={values.zip}
              onChange={e => onChange({ zip: e.target.value })}
              disabled={submitting}
              autoComplete="postal-code"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-2">
        <Button onClick={onFinish} className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-1" /> Finish Setup
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={onSkip}
          className="w-full"
          disabled={submitting}
        >
          Skip for now
        </Button>
        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full text-muted-foreground"
          disabled={submitting}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire step 3 into the shell (stub handlers for now)**

In `src/components/onboarding/FamilyOnboarding.tsx`, add the import and replace the step 3 placeholder:

```tsx
// Add import:
import { AddressStep } from './AddressStep'
```

Replace `{step === 3 && <div ...>Step 3 placeholder</div>}` with:

```tsx
{step === 3 && (
  <AddressStep
    values={address}
    onChange={updates => setAddress(a => ({ ...a, ...updates }))}
    onFinish={() => { /* wired in Task 5 */ }}
    onSkip={() => { /* wired in Task 5 */ }}
    onBack={() => setStep(2)}
    submitting={submitting}
    error={error}
  />
)}
```

- [ ] **Step 3: Verify step 3 in browser**

Navigate through steps 1 and 2 to reach step 3.

Expected:
- Address fields visible; State pre-filled with "CA"
- "Finish Setup" and "Skip for now" buttons both present (clicking them does nothing yet — wired in Task 5)
- "Back" returns to step 2 with children data intact
- Fields are disabled when `submitting` is true (test by temporarily setting `useState(true)` for `submitting`)

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding/AddressStep.tsx src/components/onboarding/FamilyOnboarding.tsx
git commit -m "feat: add AddressStep — step 3 of family onboarding wizard"
```

---

## Task 5: Wire the submit sequence and done screen in `FamilyOnboarding.tsx`

**Files:**
- Modify: `src/components/onboarding/FamilyOnboarding.tsx`

- [ ] **Step 1: Add mutation imports**

At the top of `FamilyOnboarding.tsx`, add:

```tsx
import { updateProfile, createFamily, createGuardian, createStudent } from '../../lib/supabase/mutations'
```

- [ ] **Step 2: Add the `handleSubmit` function inside the component (before the return)**

```tsx
async function handleSubmit(skipAddress: boolean) {
  setSubmitting(true)
  setError(null)
  try {
    const fullName = `${guardian.firstName.trim()} ${guardian.lastName.trim()}`

    await updateProfile(user.id, { display_name: fullName })

    const addrFields = skipAddress
      ? { address: null, city: null, state: null, zip: null }
      : {
          address: address.street.trim() || null,
          city: address.city.trim() || null,
          state: address.state.trim() || null,
          zip: address.zip.trim() || null,
        }

    const family = await createFamily({
      owner_user_id: user.id,
      primary_email: user.email,
      ...addrFields,
    })

    await createGuardian({
      family_id: family.family_id,
      first_name: guardian.firstName.trim(),
      last_name: guardian.lastName.trim(),
      email: user.email,
      phone_number: guardian.phone.trim(),
      relationship: guardian.relationship || null,
      is_primary_contact: true,
    })

    for (const child of children) {
      await createStudent({
        family_id: family.family_id,
        first_name: child.firstName.trim(),
        last_name: child.lastName.trim(),
        date_of_birth: child.dob,
        belt_level: null,
        status: 'active',
        notes: null,
      })
    }

    setSavedData({
      guardianName: fullName,
      childNames: children.map(c => c.firstName.trim()),
      hasAddress: !skipAddress && !!(address.street.trim() || address.city.trim()),
    })
    setStep('done')
  } catch (err) {
    setError(
      err instanceof Error ? err.message : 'Something went wrong. Please try again.'
    )
  } finally {
    setSubmitting(false)
  }
}
```

- [ ] **Step 3: Update AddressStep handlers to call `handleSubmit`**

Replace the stub `AddressStep` wiring from Task 4 with:

```tsx
{step === 3 && (
  <AddressStep
    values={address}
    onChange={updates => setAddress(a => ({ ...a, ...updates }))}
    onFinish={() => void handleSubmit(false)}
    onSkip={() => void handleSubmit(true)}
    onBack={() => setStep(2)}
    submitting={submitting}
    error={error}
  />
)}
```

- [ ] **Step 4: Add the done screen**

Add these imports at the top of `FamilyOnboarding.tsx` (add alongside existing imports — do not duplicate if already present):

```tsx
import { ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '../ui/button'
```

Replace `{step === 'done' && <div ...>Done placeholder</div>}` with:

```tsx
{step === 'done' && savedData && (
  <div className="text-center">
    <div className="mx-auto mb-5 w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
      <CheckCircle className="w-8 h-8 text-primary" />
    </div>
    <h2
      className="text-2xl font-semibold mb-2"
      style={{ fontFamily: 'var(--font-heading)' }}
    >
      Welcome to the family!
    </h2>
    <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
      Your profile is set up. You can update any details from your dashboard.
    </p>

    <div className="bg-muted rounded-xl p-4 text-left mb-7 space-y-2.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Guardian</span>
        <span className="font-medium">{savedData.guardianName}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Children</span>
        <span className="font-medium">{savedData.childNames.join(', ')}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Address</span>
        <span className={savedData.hasAddress ? 'font-medium' : 'text-muted-foreground'}>
          {savedData.hasAddress ? 'Saved' : 'Not added yet'}
        </span>
      </div>
    </div>

    <Button className="w-full" onClick={() => void onComplete()}>
      Go to Dashboard
      <ArrowRight className="w-4 h-4 ml-1" />
    </Button>
  </div>
)}
```

- [ ] **Step 5: Verify end-to-end in browser**

Complete the full flow in a browser session with a real family account that has no `families` row:

1. Log in via magic link → redirected to `/onboarding`
2. Fill in Step 1 → click Next
3. Fill in one child (or two) → click Next
4. Fill in address → click "Finish Setup"

Expected:
- Spinner shows on "Finish Setup" while saving
- Done screen appears with guardian name, child names, and "Saved" for address
- "Go to Dashboard" navigates to `/dashboard`
- In Supabase dashboard: verify rows created in `profiles`, `families`, `guardians`, `students`

Repeat with "Skip for now" on step 3 — verify address fields are null in `families` and done screen shows "Not added yet".

Repeat with a deliberate error (e.g., temporarily break a mutation) — verify the error message appears on step 3 and the user can retry.

- [ ] **Step 6: Commit**

```bash
git add src/components/onboarding/FamilyOnboarding.tsx
git commit -m "feat: wire submit sequence and done screen in FamilyOnboarding"
```

---

## Task 6: Remove old file and final cleanup

**Files:**
- Delete: `src/components/FirstLoginOnboarding.tsx`
- Verify: `src/App.tsx` (no remaining references to old component)

- [ ] **Step 1: Delete the old component**

```bash
rm src/components/FirstLoginOnboarding.tsx
```

- [ ] **Step 2: Confirm no remaining references**

```bash
grep -r "FirstLoginOnboarding" src/
```

Expected: No output.

- [ ] **Step 3: Run the build to confirm no broken imports**

```bash
npm run build
```

Expected: Build completes with no errors.

- [ ] **Step 4: Run linting**

```bash
npm run lint
```

Expected: No new lint errors introduced by this feature.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: complete family onboarding wizard — remove old FirstLoginOnboarding"
```
