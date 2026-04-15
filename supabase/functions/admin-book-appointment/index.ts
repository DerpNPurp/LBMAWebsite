// supabase/functions/admin-book-appointment/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabase = adminClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  if (userError || !user) return new Response('Unauthorized', { status: 401 })

  const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id })
  if (!isAdmin) return new Response('Forbidden', { status: 403 })

  const { leadId, slotId, appointmentDate } = await req.json()
  if (!leadId || !slotId || !appointmentDate) {
    return new Response('Missing leadId, slotId, or appointmentDate', { status: 400 })
  }

  const { data: lead } = await supabase
    .from('enrollment_leads')
    .select('lead_id, status, parent_email, booking_token')
    .eq('lead_id', leadId)
    .single()

  if (!lead) return new Response('Lead not found', { status: 404 })

  let token = lead.booking_token
  if (!token) {
    token = crypto.randomUUID()
    const { error: tokenError } = await supabase
      .from('enrollment_leads')
      .update({ booking_token: token })
      .eq('lead_id', leadId)
    if (tokenError) {
      console.error('[admin-book-appointment] token write error:', tokenError)
      return new Response('Failed to assign booking token', { status: 500 })
    }
  }

  const { data: slot } = await supabase
    .from('appointment_slots')
    .select('slot_id, start_time, day_of_week, is_active')
    .eq('slot_id', slotId)
    .eq('is_active', true)
    .single()

  if (!slot) return new Response('Slot not found or inactive', { status: 404 })

  // Validate appointment date matches slot's day_of_week
  const targetDate = new Date(appointmentDate + 'T12:00:00')
  if (targetDate.getDay() !== slot.day_of_week) {
    return new Response('Appointment date does not match slot day', { status: 422 })
  }

  const { data: override } = await supabase
    .from('appointment_slot_overrides')
    .select('override_id')
    .eq('slot_id', slotId)
    .eq('override_date', appointmentDate)
    .maybeSingle()

  if (override) return new Response('This date is blocked', { status: 422 })

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
    .eq('lead_id', leadId)

  if (updateError) return new Response('Booking failed', { status: 500 })

  const { error: notifError } = await supabase
    .from('enrollment_lead_notifications')
    .insert({
      lead_id: leadId,
      recipient_email: lead.parent_email,
      channel: 'email',
      type: 'booking_confirmation',
      status: 'queued',
    })

  if (notifError) {
    console.error('[admin-book-appointment] notification insert error:', notifError)
    return new Response('Booking saved but notification failed', { status: 500 })
  }

  return new Response(
    JSON.stringify({ ok: true, status: newStatus, appointment_date: appointmentDate, appointment_time: slot.start_time }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
