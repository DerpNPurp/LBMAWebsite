// supabase/functions/confirm-appointment/index.ts
// Public endpoint — auth is the booking_token.

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

  const { token } = await req.json()
  if (!token) return new Response('Missing token', { status: 400 })

  const supabase = adminClient()

  const { data: lead } = await supabase
    .from('enrollment_leads')
    .select('lead_id, status, appointment_date, appointment_time')
    .eq('booking_token', token)
    .single()

  if (!lead) return new Response('Invalid token', { status: 404 })

  if (lead.status === 'appointment_confirmed') {
    return new Response(
      JSON.stringify({ ok: true, already_confirmed: true, appointment_date: lead.appointment_date, appointment_time: lead.appointment_time }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (lead.status !== 'appointment_scheduled') {
    return new Response('Cannot confirm from current status', { status: 422 })
  }

  const { error } = await supabase
    .from('enrollment_leads')
    .update({ status: 'appointment_confirmed' })
    .eq('lead_id', lead.lead_id)

  if (error) return new Response('Confirmation failed', { status: 500 })

  return new Response(
    JSON.stringify({ ok: true, already_confirmed: false, appointment_date: lead.appointment_date, appointment_time: lead.appointment_time }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
