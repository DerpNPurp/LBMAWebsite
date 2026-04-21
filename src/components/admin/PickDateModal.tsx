import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Loader2 } from 'lucide-react'
import { getAppointmentSlots } from '../../lib/supabase/queries'
import { BookingCalendar } from '../shared/BookingCalendar'
import type { EnrollmentLead, AppointmentSlot } from '../../lib/types'

interface PickDateModalProps {
  lead: EnrollmentLead
  onConfirm: (leadId: string, slotId: string, appointmentDate: string) => Promise<void>
  onCancel: () => void
}

export function PickDateModal({ lead, onConfirm, onCancel }: PickDateModalProps) {
  const [slots, setSlots] = useState<AppointmentSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    getAppointmentSlots()
      .then(setSlots)
      .catch(() => setFetchError('Failed to load available slots.'))
      .finally(() => setFetching(false))
  }, [])

  async function handleConfirm(slotId: string, date: string) {
    setLoading(true)
    setFetchError(null)
    try {
      await onConfirm(lead.lead_id, slotId, date)
    } catch {
      setFetchError('Failed to book appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pick appointment date — {lead.parent_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {fetching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <BookingCalendar
              slots={slots}
              onConfirm={handleConfirm}
              submitting={loading}
              confirmLabel="Confirm Appointment"
              showAutoConfirmBadge
            />
          )}

          {fetchError && (
            <p className="text-sm text-destructive text-center">{fetchError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
