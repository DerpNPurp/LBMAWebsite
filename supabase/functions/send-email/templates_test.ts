// supabase/functions/send-email/templates_test.ts

import { assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { enrollmentNotificationHtml, messagingNotificationHtml } from './templates.ts'
import type { EnrollmentLead } from './types.ts'

const sampleLead: EnrollmentLead = {
  lead_id: 'lead-1',
  parent_name: 'Jane Doe',
  parent_email: 'jane@example.com',
  phone: '555-1234',
  student_name: 'Billy',
  student_age: 8,
  message: 'Interested in karate classes',
  source_page: 'contact',
  created_at: new Date().toISOString(),
}

Deno.test('enrollmentNotificationHtml includes parent name', () => {
  const html = enrollmentNotificationHtml(sampleLead, 'https://lbmaa.com/admin')
  assertStringIncludes(html, 'Jane Doe')
})

Deno.test('enrollmentNotificationHtml includes parent email', () => {
  const html = enrollmentNotificationHtml(sampleLead, 'https://lbmaa.com/admin')
  assertStringIncludes(html, 'jane@example.com')
})

Deno.test('enrollmentNotificationHtml includes student name', () => {
  const html = enrollmentNotificationHtml(sampleLead, 'https://lbmaa.com/admin')
  assertStringIncludes(html, 'Billy')
})

Deno.test('enrollmentNotificationHtml includes admin URL', () => {
  const html = enrollmentNotificationHtml(sampleLead, 'https://lbmaa.com/admin')
  assertStringIncludes(html, 'https://lbmaa.com/admin')
})

Deno.test('enrollmentNotificationHtml omits phone row when phone is null', () => {
  const leadNoPhone = { ...sampleLead, phone: null }
  const html = enrollmentNotificationHtml(leadNoPhone, 'https://lbmaa.com/admin')
  assertStringIncludes(html, 'Jane Doe')
})

Deno.test('messagingNotificationHtml includes sender name', () => {
  const html = messagingNotificationHtml('Master Chen', 'https://lbmaa.com/dashboard')
  assertStringIncludes(html, 'Master Chen')
})

Deno.test('messagingNotificationHtml includes portal URL', () => {
  const html = messagingNotificationHtml('Master Chen', 'https://lbmaa.com/dashboard')
  assertStringIncludes(html, 'https://lbmaa.com/dashboard')
})
