import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase/client'
import { getLeadByToken, getAppointmentSlots } from '../lib/supabase/queries'
import { BookingCalendar } from '../components/shared/BookingCalendar'
import type { AppointmentSlot } from '../lib/types'

interface LeadInfo {
  status: string
  parent_name: string
  parent_email: string
  appointment_date: string | null
  appointment_time: string | null
}

export function BookingPage() {
  const { token } = useParams<{ token: string }>()
  const [lead, setLead] = useState<LeadInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<AppointmentSlot[]>([])
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
    getAppointmentSlots()
      .then(setSlots)
      .catch(() => setError('Failed to load available dates. Please refresh.'))
  }, [lead])

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
      setLead(prev => prev
        ? { ...prev, status: data.status, appointment_date: data.appointment_date, appointment_time: data.appointment_time }
        : prev)
      setShowReschedule(false)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })
  }

  function formatTime(timeStr: string) {
    if (!timeStr) return ''
    return new Date('1970-01-01T' + timeStr).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
    })
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
          <p className="text-muted-foreground text-sm">
            {error ?? 'This booking link is no longer valid. Please contact LBMAA directly.'}
          </p>
        </div>
      </div>
    )
  }

  if (booked && !showReschedule) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full space-y-6 text-center">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
            You're booked!
          </h1>
          <div className="rounded-lg border p-5 text-left space-y-1">
            <p className="font-semibold text-base">{formatDate(booked.date)}</p>
            {booked.time && <p className="text-muted-foreground text-sm">{formatTime(booked.time)}</p>}
          </div>
          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to {lead.parent_email}.
          </p>
          {lead.status === 'appointment_confirmed' && (
            <p className="text-sm font-medium text-green-700 bg-green-50 rounded px-3 py-2 border border-green-200">
              Your attendance is confirmed
            </p>
          )}
          <button
            onClick={() => setShowReschedule(true)}
            className="text-sm text-primary underline underline-offset-2"
          >
            Need to reschedule?
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Lexend, sans-serif' }}>
            Book your enrollment appointment
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Hi {lead.parent_name}! Select a date below.
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
            {error}
          </p>
        )}

        {showReschedule ? (
          <div className="space-y-4">
            <p className="text-sm font-medium">Select a new date:</p>
            <BookingCalendar
              slots={slots}
              onConfirm={handleBook}
              submitting={submitting}
            />
            <button
              onClick={() => setShowReschedule(false)}
              className="text-sm text-muted-foreground underline underline-offset-2 block text-center w-full"
            >
              Cancel
            </button>
          </div>
        ) : (
          <BookingCalendar
            slots={slots}
            onConfirm={handleBook}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  )
}
