// supabase/functions/approve-enrollment-lead/index.ts

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

  // Verify caller is an admin
  const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  if (userError || !user) return new Response('Unauthorized', { status: 401 })

  const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id })
  if (!isAdmin) return new Response('Forbidden', { status: 403 })

  const { leadId } = await req.json()
  if (!leadId) return new Response('Missing leadId', { status: 400 })

  // Check if already approved (idempotent)
  const { data: lead } = await supabase
    .from('enrollment_leads')
    .select('lead_id, status, booking_token, parent_email')
    .eq('lead_id', leadId)
    .single()

  if (!lead) return new Response('Lead not found', { status: 404 })

  let token = lead.booking_token

  // Generate token if not yet set
  if (!token) {
    token = crypto.randomUUID()
    const { error: updateError } = await supabase
      .from('enrollment_leads')
      .update({
        status: 'approved',
        booking_token: token,
        approved_at: new Date().toISOString(),
      })
      .eq('lead_id', leadId)

    if (updateError) {
      console.error('[approve-enrollment-lead] update error:', updateError)
      return new Response('Update failed', { status: 500 })
    }
  }

  // Insert approval notification (triggers send-email webhook)
  const { error: notifError } = await supabase
    .from('enrollment_lead_notifications')
    .insert({
      lead_id: leadId,
      recipient_email: lead.parent_email,
      channel: 'email',
      type: 'approval',
      status: 'queued',
    })

  if (notifError) {
    console.error('[approve-enrollment-lead] notification insert error:', notifError)
    return new Response('Notification failed', { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true, booking_token: token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
