# Onboarding Privacy Agreement & Email Notification Advisory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mandatory step 0 to the family onboarding wizard that advises users to enable email notifications and requires agreement to Terms of Use and Privacy Policy before proceeding; also add `/privacy` and `/terms` public pages containing the full policy text.

**Architecture:** New `AgreementStep` component becomes the initial state of `FamilyOnboarding`'s wizard (step `0`); two new static page components (`PrivacyPage`, `TermsPage`) are added to `src/pages/` and wired as public routes in `App.tsx`. No backend changes — agreement is a UI gate only.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui, react-router-dom

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/components/onboarding/AgreementStep.tsx` | Create | Step 0 UI: email advisory + agreement checkbox |
| `src/components/onboarding/FamilyOnboarding.tsx` | Modify | Add step `0` to state machine; render `AgreementStep` |
| `src/pages/PrivacyPage.tsx` | Create | Static privacy policy at `/privacy` |
| `src/pages/TermsPage.tsx` | Create | Static terms of use at `/terms` |
| `src/App.tsx` | Modify | Add public `/privacy` and `/terms` routes |

---

## Task 1: Create AgreementStep component

**Files:**
- Create: `src/components/onboarding/AgreementStep.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/onboarding/AgreementStep.tsx
import { useState } from 'react'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { ArrowRight } from 'lucide-react'

interface AgreementStepProps {
  onNext: () => void
}

export function AgreementStep({ onNext }: AgreementStepProps) {
  const [agreed, setAgreed] = useState(false)

  return (
    <div>
      <p
        className="text-xs font-semibold tracking-wider uppercase text-primary mb-1"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Before you begin
      </p>
      <h2 className="text-2xl font-semibold mb-7" style={{ fontFamily: 'var(--font-heading)' }}>
        A few things first
      </h2>

      <div className="border-l-2 border-primary bg-secondary rounded-r-xl p-4 mb-6">
        <p className="text-sm font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
          Enable email notifications on your device
        </p>
        <p className="text-sm text-secondary-foreground leading-relaxed">
          All updates from this portal are sent to your email. Make sure email notifications
          are enabled on your phone or personal device so you don't miss anything.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer mb-8">
        <Checkbox
          id="agree"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(checked === true)}
          className="mt-0.5 flex-shrink-0"
        />
        <span className="text-sm text-muted-foreground leading-relaxed">
          I have read and agree to the{' '}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
          >
            Terms of Use
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
          >
            Privacy Policy
          </a>{' '}
          of the LBMAA Family Portal.
        </span>
      </label>

      <Button
        type="button"
        onClick={onNext}
        disabled={!agreed}
        className="w-full"
      >
        Get Started
        <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run build 2>&1 | grep -E "error|Error"
```

Expected: no errors referencing `AgreementStep.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/AgreementStep.tsx
git commit -m "add agreement step component"
```

---

## Task 2: Wire AgreementStep into FamilyOnboarding

**Files:**
- Modify: `src/components/onboarding/FamilyOnboarding.tsx`

- [ ] **Step 1: Update the step type and PROGRESS map**

In `FamilyOnboarding.tsx`, change:

```ts
// Before
const PROGRESS: Record<1 | 2 | 3, number> = { 1: 33, 2: 66, 3: 90 }
```

```ts
// After
const PROGRESS: Record<0 | 1 | 2 | 3, number> = { 0: 8, 1: 33, 2: 66, 3: 90 }
```

- [ ] **Step 2: Update the useState type and initial value**

```ts
// Before
const [step, setStep] = useState<1 | 2 | 3 | 'done'>(1)
```

```ts
// After
const [step, setStep] = useState<0 | 1 | 2 | 3 | 'done'>(0)
```

- [ ] **Step 3: Update the progressPct line**

```ts
// Before
const progressPct = step === 'done' ? 100 : PROGRESS[step as 1 | 2 | 3]
```

```ts
// After
const progressPct = step === 'done' ? 100 : PROGRESS[step as 0 | 1 | 2 | 3]
```

- [ ] **Step 4: Add AgreementStep import and render**

Add import at the top of the file alongside the other step imports:

```ts
import { AgreementStep } from './AgreementStep'
```

In the step area JSX, add the step 0 render before the existing `step === 1` block:

```tsx
{step === 0 && (
  <AgreementStep onNext={() => setStep(1)} />
)}
{step === 1 && (
  <GuardianStep
    ...
```

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error"
```

Expected: no errors

- [ ] **Step 6: Smoke test in browser**

```bash
npm run dev
```

Navigate to `/onboarding` (or trigger onboarding flow). Confirm:
- Progress bar starts at ~8%
- Email advisory callout is visible with left red border
- "Get Started" button is disabled (greyed out) until checkbox is checked
- Checking the box enables the button
- Clicking "Get Started" advances to Step 1 (Guardian Info)

- [ ] **Step 7: Commit**

```bash
git add src/components/onboarding/FamilyOnboarding.tsx
git commit -m "add agreement step to onboarding wizard"
```

---

## Task 3: Create PrivacyPage

**Files:**
- Create: `src/pages/PrivacyPage.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/pages/PrivacyPage.tsx
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
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
        <Link
          to="/"
          className="flex items-center gap-1 text-xs text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-12">
        <h1
          className="text-3xl font-semibold mb-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Los Banos Martial Arts Academy — Last updated May 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              1. What we collect
            </h2>
            <p className="text-muted-foreground">
              When you create a family profile, we collect your name, email address, phone number,
              and home address. We also collect the names and dates of birth of children you add
              to your profile, and messages you send through the portal.
            </p>
          </section>

          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              2. How we use it
            </h2>
            <p className="text-muted-foreground">
              We use your information to operate the portal, communicate with you about your
              child's enrollment, and support internal school administration. We do not use your
              data for marketing and we do not sell it to third parties.
            </p>
          </section>

          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              3. How we store it
            </h2>
            <p className="text-muted-foreground">
              Your data is stored securely via Supabase, a third-party cloud database provider.
              Access is restricted to authorized school staff only.
            </p>
          </section>

          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              4. Children's data
            </h2>
            <p className="text-muted-foreground">
              All information about minors is entered by a parent or legal guardian on their
              behalf. We do not knowingly collect information directly from children.
            </p>
          </section>

          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              5. Your rights
            </h2>
            <p className="text-muted-foreground">
              You may request correction or deletion of your data at any time by contacting us.
              We will respond within a reasonable timeframe.
            </p>
          </section>

          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              6. Changes to this policy
            </h2>
            <p className="text-muted-foreground">
              We may update this policy from time to time. If we do, we will notify you by email.
            </p>
          </section>

          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              7. Contact
            </h2>
            <p className="text-muted-foreground">
              Los Banos Martial Arts Academy
              <br />
              <a
                href="mailto:vincedoanschool@gmail.com"
                className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
              >
                vincedoanschool@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error"
```

Expected: no errors referencing `PrivacyPage.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/pages/PrivacyPage.tsx
git commit -m "add privacy policy page"
```

---

## Task 4: Create TermsPage

**Files:**
- Create: `src/pages/TermsPage.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/pages/TermsPage.tsx
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
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
        <Link
          to="/"
          className="flex items-center gap-1 text-xs text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-12">
        <h1
          className="text-3xl font-semibold mb-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Terms of Use
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Los Banos Martial Arts Academy — Last updated May 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              1. Acceptance
            </h2>
            <p className="text-muted-foreground">
              By accessing or using the LBMAA Family Portal, you agree to these Terms of Use.
              If you do not agree, do not use the portal.
            </p>
          </section>

          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              2. Eligibility
            </h2>
            <p className="text-muted-foreground">
              Access is by invitation only. Accounts are issued exclusively to authorized LBMAA
              families. You may not use an account that was not issued to you.
            </p>
          </section>

          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              3. Account responsibility
            </h2>
            <p className="text-muted-foreground">
              You are responsible for keeping your login credentials secure. Do not share your
              account with others.
            </p>
          </section>

          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              4. Acceptable use
            </h2>
            <p className="text-muted-foreground">
              The portal is provided for family-school communication related to LBMAA enrollment.
              You may not use it to harass others, attempt unauthorized access, or for any purpose
              outside its intended scope.
            </p>
          </section>

          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              5. Content you submit
            </h2>
            <p className="text-muted-foreground">
              You are responsible for the accuracy of information and messages you submit through
              the portal.
            </p>
          </section>

          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              6. Service availability
            </h2>
            <p className="text-muted-foreground">
              We do not guarantee uninterrupted or error-free access to the portal. We may modify
              or discontinue the service at any time without notice.
            </p>
          </section>

          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              7. Limitation of liability
            </h2>
            <p className="text-muted-foreground">
              The portal is provided "as is." Los Banos Martial Arts Academy is not liable for
              data loss, service interruptions, or any indirect or consequential damages arising
              from your use of the website.
            </p>
          </section>

          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              8. Governing law
            </h2>
            <p className="text-muted-foreground">
              These terms are governed by the laws of the State of California.
            </p>
          </section>

          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              9. Changes to terms
            </h2>
            <p className="text-muted-foreground">
              We may update these terms at any time. Changes will be communicated by email.
            </p>
          </section>

          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              10. Contact
            </h2>
            <p className="text-muted-foreground">
              Los Banos Martial Arts Academy
              <br />
              <a
                href="mailto:vincedoanschool@gmail.com"
                className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
              >
                vincedoanschool@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error"
```

Expected: no errors referencing `TermsPage.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/pages/TermsPage.tsx
git commit -m "add terms of use page"
```

---

## Task 5: Add public routes in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add imports**

At the top of `src/App.tsx`, alongside the other page imports, add:

```ts
import { PrivacyPage } from './pages/PrivacyPage'
import { TermsPage } from './pages/TermsPage'
```

- [ ] **Step 2: Add routes**

Inside the `<Routes>` block in `AppRoutes`, add the two public routes before the catch-all `* → /` redirect:

```tsx
<Route path="/privacy" element={<PrivacyPage />} />
<Route path="/terms" element={<TermsPage />} />
<Route path="*" element={<Navigate to="/" replace />} />
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error"
```

Expected: no errors

- [ ] **Step 4: Smoke test in browser**

```bash
npm run dev
```

Visit:
- `http://localhost:5173/privacy` — Privacy Policy page loads, brand header present, all 7 sections visible, email link works
- `http://localhost:5173/terms` — Terms of Use page loads, brand header present, all 10 sections visible, email link works
- Click "Back" on each — returns to `/`
- Trigger onboarding flow — clicking "Terms of Use" link in step 0 opens `/terms` in a new tab; "Privacy Policy" opens `/privacy` in a new tab

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "add privacy and terms routes"
```
