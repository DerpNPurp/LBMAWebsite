// supabase/functions/book-appointment/index.ts
// Public endpoint — auth is the booking_token, no Supabase session required.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )
}

const BOOKABLE_STATUSES = ['approved', 'appointment_scheduled', 'appointment_confirmed']

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { token, slotId, appointmentDate } = await req.json()
  if (!token || !slotId || !appointmentDate) {
    return new Response('Missing token, slotId, or appointmentDate', { status: 400 })
  }

  const supabase = adminClient()

  // Lookup lead by token
  const { data: lead } = await supabase
    .from('enrollment_leads')
    .select('lead_id, status, parent_email, parent_name, booking_token')
    .eq('booking_token', token)
    .single()

  if (!lead) return new Response('Invalid booking token', { status: 404 })
  if (!BOOKABLE_STATUSES.includes(lead.status)) {
    return new Response('This booking link is no longer valid', { status: 422 })
  }

  // Validate slot exists and is active
  const { data: slot } = await supabase
    .from('appointment_slots')
    .select('slot_id, start_time, end_time, day_of_week, is_active')
    .eq('slot_id', slotId)
    .eq('is_active', true)
    .single()

  if (!slot) return new Response('Slot not found or inactive', { status: 404 })

  // Validate appointment date matches slot's day_of_week
  const targetDate = new Date(appointmentDate + 'T12:00:00')
  if (targetDate.getDay() !== slot.day_of_week) {
    return new Response('Appointment date does not match slot day', { status: 422 })
  }

  // Check for overrides
  const { data: override } = await supabase
    .from('appointment_slot_overrides')
    .select('override_id')
    .eq('slot_id', slotId)
    .eq('override_date', appointmentDate)
    .maybeSingle()

  if (override) return new Response('This date is not available', { status: 422 })

  // Determine if date is within 2 days (auto-confirm)
  // Use UTC midnight for consistent day-boundary comparison (edge function runs in UTC)
  const nowUtc = new Date()
  const todayUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate()))
  const daysUntilAppt = Math.floor((targetDate.getTime() - todayUtc.getTime()) / (1000 * 60 * 60 * 24))
  const autoConfirm = daysUntilAppt < 2
  const newStatus = autoConfirm ? 'appointment_confirmed' : 'appointment_scheduled'

  const { error: updateError } = await supabase
    .from('enrollment_leads')
    .update({
      appointment_date: appointmentDate,
      appointment_time: slot.start_time,
      status: newStatus,
    })
    .eq('lead_id', lead.lead_id)

  if (updateError) return new Response('Booking failed', { status: 500 })

  // Send booking confirmation
  const { error: notifError } = await supabase
    .from('enrollment_lead_notifications')
    .insert({
      lead_id: lead.lead_id,
      recipient_email: lead.parent_email,
      channel: 'email',
      type: 'booking_confirmation',
      status: 'queued',
    })

  if (notifError) {
    console.error('[book-appointment] notification insert error:', notifError)
    return new Response('Booking saved but notification failed', { status: 500 })
  }

  return new Response(
    JSON.stringify({
      ok: true,
      status: newStatus,
      appointment_date: appointmentDate,
      appointment_time: slot.start_time,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
