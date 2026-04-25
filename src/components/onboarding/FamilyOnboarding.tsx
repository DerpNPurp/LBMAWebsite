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
