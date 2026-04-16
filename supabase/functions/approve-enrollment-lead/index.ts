// supabase/functions/approve-enrollment-lead/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS })

  // Use a client initialized with the user's auth header to verify identity via
  // the Supabase Auth API. This works with ES256 asymmetric JWTs, unlike
  // manual JWT decoding + verify_jwt:true (which only supports HS256).
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
  )
  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS })

  const supabase = adminClient()

  const { data: isAdmin } = await supabase.rpc('is_admin', { user_uuid: user.id })
  if (!isAdmin) return new Response('Forbidden', { status: 403, headers: CORS_HEADERS })

  const { leadId } = await req.json()
  if (!leadId) return new Response('Missing leadId', { status: 400, headers: CORS_HEADERS })

  const { data: lead } = await supabase
    .from('enrollment_leads')
    .select('lead_id, status, booking_token, parent_email')
    .eq('lead_id', leadId)
    .single()

  if (!lead) return new Response('Lead not found', { status: 404, headers: CORS_HEADERS })

  let token = lead.booking_token
  const updateFields: Record<string, unknown> = {
    status: 'approved',
    approved_at: new Date().toISOString(),
  }

  if (!token) {
    token = crypto.randomUUID()
    updateFields.booking_token = token
  }

  const { error: updateError } = await supabase
    .from('enrollment_leads')
    .update(updateFields)
    .eq('lead_id', leadId)

  if (updateError) {
    console.error('[approve-enrollment-lead] update error:', updateError)
    return new Response('Update failed', { status: 500, headers: CORS_HEADERS })
  }

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
    return new Response('Notification failed', { status: 500, headers: CORS_HEADERS })
  }

  return new Response(JSON.stringify({ ok: true, booking_token: token }), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
})
