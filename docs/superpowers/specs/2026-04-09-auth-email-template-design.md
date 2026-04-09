# Auth Email Template Design

**Date:** 2026-04-09
**Scope:** Supabase magic link email sent to families when they request a sign-in link

---

## Problem

The default Supabase OTP email is minimal and technical. Non-tech-savvy families receive a bare "click this link to login" message with no context, no branding, and no guidance — which looks like spam and causes confusion.

## Goal

Replace the default Supabase magic link email with a branded, family-friendly template that clearly communicates what the email is, what to do, and who to contact if something goes wrong.

---

## Design

### Style

Minimal with a red-to-dark gradient color stripe at the top. Clean typography, no heavy graphics. Works in all email clients (inline styles, no external CSS).

Colors:
- Red: `#c8102e`
- Dark: `#1a1a2e`
- Body text: `#555`
- Footer text: `#aaa` / `#bbb`

### Subject Line

```
Your LBMAA Sign-In Link — Family Portal
```

Clear and specific so families don't mistake it for spam.

### Email Structure

1. **Color stripe** — 5px red-to-dark gradient at top for brand recognition
2. **Header** — "LOS BANOS MARTIAL ARTS ACADEMY" in red uppercase, "Member Family Portal" subtitle
3. **Heading** — "You're one click away"
4. **Body copy** — "We received a sign-in request for your family account. Click the button below to access your portal — no password needed."
5. **CTA button** — "Access My Portal" in red (`#c8102e`), centered
6. **Expiry notice** — "🔒 This link expires in 1 hour. If it expires, just go back and request a new one."
7. **Divider**
8. **Troubleshooting** — "Didn't request this? You can safely ignore this email — your account won't be affected."
9. **Contact** — "Need help? Reach us at info@lbmaa.com or call (209) 555-0123"

> Note: `(209) 555-0123` is a placeholder. Update with the real number before going live.

### Supabase Template Variable

The CTA button href uses `{{ .ConfirmationURL }}` — the Supabase magic link variable for the OTP email template.

---

## Implementation

This template is configured in the **Supabase dashboard** under:
`Authentication → Email Templates → Magic Link`

Two fields to update:
- **Subject:** `Your LBMAA Sign-In Link — Family Portal`
- **Body:** Full HTML template (see below)

The HTML uses inline styles throughout for email client compatibility. No external fonts or images — just system fonts and CSS color values.

---

## HTML Template

```html
<div style="font-family:Arial,sans-serif;font-size:13px;color:#333;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;">

  <div style="height:5px;background:linear-gradient(to right,#c8102e,#1a1a2e);"></div>

  <div style="padding:20px 28px 16px;border-bottom:1px solid #f0f0f0;">
    <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#c8102e;font-weight:700;margin-bottom:3px;">Los Banos Martial Arts Academy</div>
    <div style="font-size:12px;color:#999;">Member Family Portal</div>
  </div>

  <div style="padding:24px 28px;">
    <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1a1a2e;">You're one click away</p>
    <p style="margin:0 0 22px;color:#555;font-size:13px;line-height:1.65;">We received a sign-in request for your family account. Click the button below to access your portal — no password needed.</p>

    <div style="text-align:center;margin-bottom:20px;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#c8102e;color:#fff;font-weight:700;padding:13px 36px;border-radius:4px;text-decoration:none;font-size:14px;letter-spacing:0.5px;">Access My Portal</a>
    </div>

    <p style="margin:0 0 18px;font-size:11px;color:#aaa;text-align:center;">🔒 This link expires in <strong style="color:#888;">1 hour</strong>. If it expires, just go back and request a new one.</p>

    <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 16px;" />

    <p style="margin:0 0 8px;font-size:11px;color:#bbb;line-height:1.5;"><strong style="color:#aaa;">Didn't request this?</strong> You can safely ignore this email — your account won't be affected.</p>
    <p style="margin:0;font-size:11px;color:#bbb;line-height:1.5;"><strong style="color:#aaa;">Need help?</strong> Reach us at <a href="mailto:info@lbmaa.com" style="color:#c8102e;text-decoration:none;">info@lbmaa.com</a> or call <a href="tel:+12095550123" style="color:#c8102e;text-decoration:none;">(209) 555-0123</a></p>
  </div>

</div>
```

---

## Out of Scope

- Other Supabase email types (invite, password reset, email change) — not used in this app
- Custom SMTP / sending domain setup
- Email open/click tracking
