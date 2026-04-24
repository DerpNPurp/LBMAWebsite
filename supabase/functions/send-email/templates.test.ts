import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { bookingConfirmationHtml, reminderEmailHtml } from './templates.ts'
import type { AppointmentInfo } from './types.ts'

const single: AppointmentInfo[] = [
  {
    programLabel: 'Little Dragons',
    childNames: 'Emma',
    date: 'Monday, April 28, 2026',
    time: '4:00 PM',
    rebookingUrl: 'https://lbmaa.com/book/abc123',
    bookingToken: 'abc123',
  },
]

const multi: AppointmentInfo[] = [
  {
    programLabel: 'Little Dragons',
    childNames: 'Emma & Lily',
    date: 'Monday, April 28, 2026',
    time: '4:00 PM',
    rebookingUrl: 'https://lbmaa.com/book/abc123',
    bookingToken: 'abc123',
  },
  {
    programLabel: 'Youth Program',
    childNames: 'Jake',
    date: 'Wednesday, April 30, 2026',
    time: '5:30 PM',
    rebookingUrl: 'https://lbmaa.com/book/def456',
    bookingToken: 'def456',
  },
]

Deno.test('bookingConfirmationHtml — single: contains date, time, program, child, reschedule link', () => {
  const html = bookingConfirmationHtml('Eduardo Guerra', single)
  assertEquals(html.includes('Eduardo Guerra'), true)
  assertEquals(html.includes('Monday, April 28, 2026'), true)
  assertEquals(html.includes('4:00 PM'), true)
  assertEquals(html.includes('Little Dragons'), true)
  assertEquals(html.includes('Emma'), true)
  assertEquals(html.includes('https://lbmaa.com/book/abc123'), true)
})

Deno.test('bookingConfirmationHtml — multi: contains all programs, dates, times', () => {
  const html = bookingConfirmationHtml('Eduardo Guerra', multi)
  assertEquals(html.includes('Little Dragons'), true)
  assertEquals(html.includes('Youth Program'), true)
  assertEquals(html.includes('Monday, April 28, 2026'), true)
  assertEquals(html.includes('Wednesday, April 30, 2026'), true)
  assertEquals(html.includes('4:00 PM'), true)
  assertEquals(html.includes('5:30 PM'), true)
  assertEquals(html.includes('Jake'), true)
  assertEquals(html.includes('https://lbmaa.com/book/abc123'), true)
  assertEquals(html.includes('https://lbmaa.com/book/def456'), true)
})
