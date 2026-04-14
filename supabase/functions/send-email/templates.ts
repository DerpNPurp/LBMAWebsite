// supabase/functions/send-email/templates.ts

import type { EnrollmentLead } from './types.ts'

export function enrollmentNotificationHtml(_lead: EnrollmentLead, _adminUrl: string): string {
  return ''
}

export function messagingNotificationHtml(_senderName: string, _portalUrl: string): string {
  return ''
}
