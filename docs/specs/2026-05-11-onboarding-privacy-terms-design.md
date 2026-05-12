# Onboarding Privacy Agreement & Email Notification Advisory

## Summary

Add a dedicated first step to the family onboarding wizard that:
1. Advises users to enable email notifications on their personal device
2. Requires agreement to the Terms of Use and Privacy Policy before proceeding

Also adds two new static pages (`/privacy`, `/terms`) containing the full policy text.

---

## Onboarding Step 0 — "A few things first"

### Placement
New step inserted before the existing Step 1 (Guardian Info). The progress bar reflects this — step 0 sits at ~8% progress. Existing steps remain numbered 1–3 in their labels but are still steps 2–4 in the internal state machine.

The `step` state in `FamilyOnboarding.tsx` gains a new value `0` as the initial state (was `1`).

### Layout
Matches existing onboarding design exactly: same brand header, same progress bar, same max-width container, same font and color system.

**Email notification advisory** — a left-bordered callout card using the `secondary` background (`#F5E6E8`) and `primary` border (`#A01F23`):
- Title: "Enable email notifications on your device"
- Body: "All updates from this portal are sent to your email. Make sure email notifications are enabled on your phone or personal device so you don't miss anything."

**Agreement checkbox** — required before the button enables:
- Label: "I have read and agree to the [Terms of Use] and [Privacy Policy] of the LBMAA Family Portal."
- Both links open in a new tab (`target="_blank" rel="noopener noreferrer"`)
- Button label: "Get Started" with ArrowRight icon
- Button is disabled (`opacity-40`, `cursor-not-allowed`) until checkbox is checked

### Validation
No server-side record of agreement is stored in this iteration. The checkbox is a UI gate only — the user cannot advance without checking it. Storing agreement timestamps (for legal audit trail) is out of scope for this version.

### New component
`src/components/onboarding/AgreementStep.tsx` — self-contained, same prop shape as other steps (`onNext`).

---

## Privacy Policy Page — `/privacy`

### Route
New public route in `App.tsx`. No auth required.

### Component
`src/pages/PrivacyPage.tsx` — static content, styled to match the rest of the site (same background, heading font, body font, max-width prose container).

### Sections

1. **What we collect**
   Name, email address, phone number, home address, children's names and dates of birth, and messages sent through the portal.

2. **How we use it**
   To operate the portal, communicate with you about your child's enrollment, and support internal school administration. We do not use your data for marketing or sell it to third parties.

3. **How we store it**
   Data is stored securely via Supabase, a third-party cloud database provider. Access is restricted to authorized school staff only.

4. **Children's data**
   All information about minors is entered by a parent or legal guardian on their behalf. We do not knowingly collect information directly from children.

5. **Your rights**
   You may request correction or deletion of your data at any time by contacting us. We will respond within a reasonable timeframe.

6. **Changes to this policy**
   We may update this policy. If we do, we will notify you by email.

7. **Contact**
   Los Banos Martial Arts Academy — vincedoanschool@gmail.com

---

## Terms of Use Page — `/terms`

### Route
New public route in `App.tsx`. No auth required.

### Component
`src/pages/TermsPage.tsx` — static content, same styling as PrivacyPage.

### Sections

1. **Acceptance**
   By accessing or using the LBMAA Family Portal, you agree to these Terms of Use. If you do not agree, do not use the portal.

2. **Eligibility**
   Access is by invitation only. Accounts are issued exclusively to authorized LBMAA families. You may not use an account that was not issued to you.

3. **Account responsibility**
   You are responsible for keeping your login credentials secure. Do not share your account with others.

4. **Acceptable use**
   The portal is provided for family-school communication related to LBMAA enrollment. You may not use it to harass others, attempt unauthorized access, or for any purpose outside its intended scope.

5. **Content you submit**
   You are responsible for the accuracy of information and messages you submit through the portal.

6. **Service availability**
   We do not guarantee uninterrupted or error-free access to the portal. We may modify or discontinue the service at any time without notice.

7. **Limitation of liability**
   The portal is provided "as is." Los Banos Martial Arts Academy is not liable for data loss, service interruptions, or any indirect or consequential damages arising from your use of the website.

8. **Governing law**
   These terms are governed by the laws of the State of California.

9. **Changes to terms**
   We may update these terms at any time. Changes will be communicated by email.

10. **Contact**
    Los Banos Martial Arts Academy — vincedoanschool@gmail.com

---

## Files to Create or Modify

| File | Change |
|------|--------|
| `src/components/onboarding/AgreementStep.tsx` | New component — step 0 |
| `src/components/onboarding/FamilyOnboarding.tsx` | Add step `0` as initial state; render `AgreementStep` |
| `src/pages/PrivacyPage.tsx` | New static page |
| `src/pages/TermsPage.tsx` | New static page |
| `src/App.tsx` | Add `/privacy` and `/terms` routes (public) |

---

## Out of Scope

- Storing agreement timestamps or audit logs
- User-facing "update your agreement" flow if terms change
- In-app push notifications of any kind
