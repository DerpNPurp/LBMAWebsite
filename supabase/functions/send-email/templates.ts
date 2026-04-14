// supabase/functions/send-email/templates.ts

import type { EnrollmentLead } from './types.ts'

const STRIPE = `<div style="height:5px;background:linear-gradient(to right,#c8102e,#1a1a2e);"></div>`

const HEADER = `
  <div style="padding:20px 28px 16px;border-bottom:1px solid #f0f0f0;">
    <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#c8102e;font-weight:700;margin-bottom:3px;">Los Banos Martial Arts Academy</div>
    <div style="font-size:12px;color:#999;">Member Family Portal</div>
  </div>
`

const FOOTER = `
  <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 16px;" />
  <p style="margin:0;font-size:11px;color:#bbb;line-height:1.5;">
    <strong style="color:#aaa;">Need help?</strong> Reach us at
    <a href="mailto:info@lbmaa.com" style="color:#c8102e;text-decoration:none;">info@lbmaa.com</a>
  </p>
`

function wrap(inner: string): string {
  return `<div style="font-family:Arial,sans-serif;font-size:13px;color:#333;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;">
    ${STRIPE}
    ${HEADER}
    <div style="padding:24px 28px;">
      ${inner}
      ${FOOTER}
    </div>
  </div>`
}

function ctaButton(href: string, label: string): string {
  return `<div style="text-align:center;margin-bottom:20px;">
    <a href="${href}" style="display:inline-block;background:#c8102e;color:#fff;font-weight:700;padding:13px 36px;border-radius:4px;text-decoration:none;font-size:14px;letter-spacing:0.5px;">${label}</a>
  </div>`
}

export function enrollmentNotificationHtml(lead: EnrollmentLead, adminUrl: string): string {
  const rows = [
    `<tr><td style="padding:4px 0;font-weight:700;color:#1a1a2e;width:110px;">Parent</td><td style="padding:4px 0;color:#555;">${lead.parent_name}</td></tr>`,
    `<tr><td style="padding:4px 0;font-weight:700;color:#1a1a2e;">Email</td><td style="padding:4px 0;color:#555;">${lead.parent_email}</td></tr>`,
    lead.phone ? `<tr><td style="padding:4px 0;font-weight:700;color:#1a1a2e;">Phone</td><td style="padding:4px 0;color:#555;">${lead.phone}</td></tr>` : '',
    lead.student_name ? `<tr><td style="padding:4px 0;font-weight:700;color:#1a1a2e;">Student</td><td style="padding:4px 0;color:#555;">${lead.student_name}${lead.student_age ? ` (age ${lead.student_age})` : ''}</td></tr>` : '',
    lead.message ? `<tr><td style="padding:4px 0;font-weight:700;color:#1a1a2e;vertical-align:top;">Message</td><td style="padding:4px 0;color:#555;">${lead.message}</td></tr>` : '',
  ].join('')

  return wrap(`
    <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1a1a2e;">New enrollment inquiry</p>
    <p style="margin:0 0 16px;color:#555;font-size:13px;line-height:1.65;">A family submitted an enrollment inquiry through the website.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${rows}</table>
    ${ctaButton(adminUrl, 'View in Admin Dashboard')}
  `)
}

export function messagingNotificationHtml(senderName: string, portalUrl: string): string {
  return wrap(`
    <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1a1a2e;">You have a new message</p>
    <p style="margin:0 0 22px;color:#555;font-size:13px;line-height:1.65;">
      <strong>${senderName}</strong> sent you a message in the LBMAA portal.
    </p>
    ${ctaButton(portalUrl, 'Read Message')}
    <p style="margin:0 0 18px;font-size:11px;color:#aaa;text-align:center;">Reply directly in the portal — do not reply to this email.</p>
  `)
}
