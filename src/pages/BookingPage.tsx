import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase/client'
import { getLeadByToken, getAppointmentSlots, getUpcomingBookableDates } from '../lib/supabase/queries'
import type { AppointmentSlot } from '../lib/types'

interface LeadInfo {
  status: string
  parent_name: string
  parent_email: string
  appointment_date: string | null
  appointment_time: string | null
}

interface DateOption {
  date: string
  slotId: string
  slotLabel: string
  startTime: string
}

export function BookingPage() {
  const { token } = useParams<{ token: string }>()
  const [lead, setLead] = useState<LeadInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<AppointmentSlot[]>([])
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [dateOptions, setDateOptions] = useState<DateOption[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [booked, setBooked] = useState<{ date: string; time: string } | null>(null)
  const [showReschedule, setShowReschedule] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setError('Invalid link'); setLoading(false); return }
    getLeadByToken(token).then((data) => {
      if (!data) { setError('This booking link is no longer valid.'); setLoading(false); return }
      setLead(data)
      if (['appointment_scheduled', 'appointment_confirmed'].includes(data.status) && data.appointment_date) {
        setBooked({ date: data.appointment_date, time: data.appointment_time ?? '' })
      }
      setLoading(false)
    })
  }, [token])

  useEffect(() => {
    if (!lead || !['approved', 'appointment_scheduled', 'appointment_confirmed'].includes(lead.status)) return
    getAppointmentSlots().then((s) => {
      setSlots(s)
      if (s.length === 1) setSelectedSlotId(s[0].slot_id)
    })
  }, [lead])

  useEffect(() => {
    if (!selectedSlotId) return
    const slot = slots.find(s => s.slot_id === selectedSlotId)!
    getUpcomingBookableDates(selectedSlotId).then((dates) => {
      setDateOptions(dates.map(d => ({ date: d, slotId: selectedSlotId, slotLabel: slot.label, startTime: slot.start_time })))
      setSelectedDate(null)
    })
  }, [selectedSlotId, slots])

  async function handleBook() {
    if (!selectedDate || !selectedSlotId || !token) return
    setSubmitting(true)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('book-appointment', {
        body: { token, slotId: selectedSlotId, appointmentDate: selectedDate },
      })
      if (fnError) throw fnError
      setBooked({ date: data.appointment_date, time: data.appointment_time })
      setLead(prev => prev ? { ...prev, status: data.status, appointment_date: data.appointment_date, appointment_time: data.appointment_time } : prev)
      setShowReschedule(false)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  function formatTime(timeStr: string) {
    if (!timeStr) return ''
    return new Date('1970-01-01T' + timeStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isInvalid = !lead || ['denied', 'closed', 'enrolled'].includes(lead.status)

  if (isInvalid || error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <h1 className="text-xl font-bold">Link no longer valid</h1>
          <p className="text-muted-foreground text-sm">{error ?? 'This booking link is no longer valid. Please contact LBMAA directly.'}</p>
        </div>
      </div>
    )
  }

  const datePickerSection = (
    <div className="space-y-4">
      {slots.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {slots.map(slot => (
            <button
              key={slot.slot_id}
              onClick={() => setSelectedSlotId(slot.slot_id)}
              className={`px-3 py-1.5 rounded border text-sm transition-colors ${
                selectedSlotId === slot.slot_id ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>
      )}
      {selectedSlotId && dateOptions.length === 0 && (
        <p className="text-sm text-muted-foreground">No available dates in the next 8 weeks.</p>
      )}
      {dateOptions.length > 0 && (
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {dateOptions.map(({ date, slotLabel, startTime }) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`min-h-[56px] w-full text-left px-4 py-3 rounded border text-sm transition-colors ${
                selectedDate === date ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="font-medium">{formatDate(date)}</div>
              <div className="text-muted-foreground text-xs mt-0.5">{slotLabel} · {formatTime(startTime)}</div>
            </button>
          ))}
        </div>
      )}
      <Button onClick={handleBook} disabled={!selectedDate || submitting} className="w-full">
        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Booking…</> : 'Confirm Booking'}
      </Button>
    </div>
  )

  // Success state after booking
  if (booked && !showReschedule) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full space-y-6 text-center">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>You're booked!</h1>
          <div className="rounded-lg border p-5 text-left space-y-1">
            <p className="font-semibold text-base">{formatDate(booked.date)}</p>
            {booked.time && <p className="text-muted-foreground text-sm">{formatTime(booked.time)}</p>}
          </div>
          <p className="text-sm text-muted-foreground">A confirmation email has been sent to {lead.parent_email}.</p>
          {lead.status === 'appointment_confirmed' && (
            <p className="text-sm font-medium text-green-700 bg-green-50 rounded px-3 py-2 border border-green-200">Your attendance is confirmed</p>
          )}
          <button onClick={() => setShowReschedule(true)} className="text-sm text-primary underline underline-offset-2">Need to reschedule?</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>Book your enrollment appointment</h1>
          <p className="text-muted-foreground text-sm mt-2">Hi {lead.parent_name}! Select a date below.</p>
        </div>

        {showReschedule ? (
          <div className="space-y-4">
            <p className="text-sm font-medium">Select a new date:</p>
            {datePickerSection}
            <button onClick={() => setShowReschedule(false)} className="text-sm text-muted-foreground underline underline-offset-2 block text-center w-full">Cancel</button>
          </div>
        ) : datePickerSection}
      </div>
    </div>
  )
}
