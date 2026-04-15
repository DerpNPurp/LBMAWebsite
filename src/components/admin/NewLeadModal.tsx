import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Loader2 } from 'lucide-react'
import { createEnrollmentLead } from '../../lib/supabase/mutations'
import { supabase } from '../../lib/supabase/client'
import type { EnrollmentLead } from '../../lib/types'
import { PickDateModal } from './PickDateModal'

type PostAction = 'send_link' | 'pick_date' | 'create_only'

interface NewLeadModalProps {
  onSuccess: (lead: EnrollmentLead) => void
  onCancel: () => void
}

export function NewLeadModal({ onSuccess, onCancel }: NewLeadModalProps) {
  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentAge, setStudentAge] = useState('')
  const [notes, setNotes] = useState('')
  const [postAction, setPostAction] = useState<PostAction>('send_link')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ parentName?: string; parentEmail?: string }>({})
  const [createdLead, setCreatedLead] = useState<EnrollmentLead | null>(null)

  function validate() {
    const errs: typeof errors = {}
    if (!parentName.trim()) errs.parentName = 'Required'
    if (!parentEmail.trim()) errs.parentEmail = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) errs.parentEmail = 'Invalid email'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const leadId = await createEnrollmentLead({
        parentName: parentName.trim(),
        parentEmail: parentEmail.trim(),
        phone: phone.trim() || undefined,
        studentName: studentName.trim() || undefined,
        studentAge: studentAge ? parseInt(studentAge) : undefined,
        notes: notes.trim() || undefined,
      })

      const { data: leadData } = await supabase
        .from('enrollment_leads')
        .select('*')
        .eq('lead_id', leadId)
        .single()

      if (postAction === 'send_link') {
        await supabase.functions.invoke('approve-enrollment-lead', {
          body: { leadId },
          headers: { Authorization: `Bearer ${session?.access_token}` },
        })
        onSuccess(leadData as EnrollmentLead)
      } else if (postAction === 'create_only') {
        onSuccess(leadData as EnrollmentLead)
      } else if (postAction === 'pick_date') {
        setCreatedLead(leadData as EnrollmentLead)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handlePickDateConfirm(leadId: string, slotId: string, appointmentDate: string) {
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.functions.invoke('admin-book-appointment', {
      body: { leadId, slotId, appointmentDate },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    const { data: updatedLead } = await supabase
      .from('enrollment_leads')
      .select('*')
      .eq('lead_id', leadId)
      .single()
    onSuccess(updatedLead as EnrollmentLead)
  }

  const ctaLabel = loading
    ? undefined
    : postAction === 'send_link' ? 'Create & Send Link'
    : postAction === 'pick_date' ? 'Create & Pick Date'
    : 'Create Lead'

  if (createdLead) {
    return (
      <PickDateModal
        lead={createdLead}
        onConfirm={handlePickDateConfirm}
        onCancel={onCancel}
      />
    )
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New enrollment lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="nl-parent-name">Parent name *</Label>
              <Input id="nl-parent-name" value={parentName} onChange={e => setParentName(e.target.value)} onBlur={validate} className="mt-1" />
              {errors.parentName && <p className="text-xs text-destructive mt-1">{errors.parentName}</p>}
            </div>
            <div>
              <Label htmlFor="nl-email">Email *</Label>
              <Input id="nl-email" type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} onBlur={validate} className="mt-1" />
              {errors.parentEmail && <p className="text-xs text-destructive mt-1">{errors.parentEmail}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="nl-phone">Phone</Label>
              <Input id="nl-phone" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="nl-student-name">Student name</Label>
              <Input id="nl-student-name" value={studentName} onChange={e => setStudentName(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="nl-age">Student age</Label>
            <Input id="nl-age" type="number" min={1} max={99} value={studentAge} onChange={e => setStudentAge(e.target.value)} className="mt-1 w-24" />
          </div>
          <div>
            <Label htmlFor="nl-notes">Notes</Label>
            <Textarea id="nl-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1" />
          </div>
          <div>
            <Label>After creating</Label>
            <div className="flex gap-2 mt-1.5">
              {(['send_link', 'pick_date', 'create_only'] as PostAction[]).map(action => (
                <button
                  key={action}
                  type="button"
                  onClick={() => setPostAction(action)}
                  className={`px-3 py-1.5 rounded border text-sm transition-colors ${
                    postAction === action
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {action === 'send_link' ? 'Send Booking Link' : action === 'pick_date' ? 'Pick Date for Them' : 'Create Only'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : ctaLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
