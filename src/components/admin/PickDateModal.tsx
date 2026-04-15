import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Loader2 } from 'lucide-react'
import { getAppointmentSlots, getUpcomingBookableDates } from '../../lib/supabase/queries'
import type { EnrollmentLead, AppointmentSlot } from '../../lib/types'

interface DateOption {
  date: string
  slotId: string
  slotLabel: string
}

interface PickDateModalProps {
  lead: EnrollmentLead
  onConfirm: (leadId: string, slotId: string, appointmentDate: string) => Promise<void>
  onCancel: () => void
}

export function PickDateModal({ lead, onConfirm, onCancel }: PickDateModalProps) {
  const [slots, setSlots] = useState<AppointmentSlot[]>([])
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [dateOptions, setDateOptions] = useState<DateOption[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    getAppointmentSlots().then((s) => {
      setSlots(s)
      if (s.length === 1) setSelectedSlotId(s[0].slot_id)
    }).finally(() => setFetching(false))
  }, [])

  useEffect(() => {
    if (!selectedSlotId) return
    getUpcomingBookableDates(selectedSlotId).then((dates) => {
      const slot = slots.find(s => s.slot_id === selectedSlotId)!
      setDateOptions(dates.map(d => ({ date: d, slotId: selectedSlotId, slotLabel: slot.label })))
      setSelectedDate(null)
    })
  }, [selectedSlotId, slots])

  function isWithin2Days(dateStr: string) {
    const appt = new Date(dateStr + 'T12:00:00')
    const now = new Date()
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    return Math.floor((appt.getTime() - todayUtc.getTime()) / (1000 * 60 * 60 * 24)) < 2
  }

  async function handleConfirm() {
    if (!selectedDate || !selectedSlotId) return
    setLoading(true)
    try {
      await onConfirm(lead.lead_id, selectedSlotId, selectedDate)
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
        <div className="space-y-4">
          {slots.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {slots.map(slot => (
                <button
                  key={slot.slot_id}
                  onClick={() => setSelectedSlotId(slot.slot_id)}
                  className={`px-3 py-1.5 rounded border text-sm transition-colors ${
                    selectedSlotId === slot.slot_id
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
          {fetching ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : !selectedSlotId ? (
            <p className="text-sm text-muted-foreground text-center py-4">Select a slot above to see available dates.</p>
          ) : dateOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No available dates in the next 8 weeks.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {dateOptions.map(({ date, slotLabel }) => {
                const within2 = isWithin2Days(date)
                const d = new Date(date + 'T12:00:00')
                const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-[56px] w-full text-left px-4 py-3 rounded border text-sm transition-colors ${
                      selectedDate === date
                        ? 'ring-2 ring-primary border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">{slotLabel}</div>
                    {within2 && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-xs rounded bg-amber-100 text-amber-800 border border-amber-200">Will be auto-confirmed</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selectedDate || loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Booking…</> : 'Confirm Appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
