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
