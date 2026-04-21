# Calendar Booking UI

**Date:** 2026-04-20
**Status:** Approved

## Summary

Replace the scrollable date-button list in the enrollment booking flow with a classic month-grid calendar. Applies to both the prospect-facing `BookingPage` and the admin `PickDateModal`. A shared `BookingCalendar` component eliminates duplicated logic.

---

## Surfaces affected

| File | Role |
|---|---|
| `src/pages/BookingPage.tsx` | Prospect self-books via token link from email |
| `src/components/admin/PickDateModal.tsx` | Admin books on behalf of a prospect |

No changes to backend RPCs, edge functions, or database schema.

---

## New component

**`src/components/shared/BookingCalendar.tsx`**

### Props

```ts
interface BookingCalendarProps {
  slots: AppointmentSlot[]
  onConfirm: (slotId: string, date: string) => Promise<void>
  submitting: boolean
  confirmLabel?: string   // default: "Confirm Booking"
  showAutoConfirmBadge?: boolean  // default: false; PickDateModal sets true
}
```

### Behaviour

1. On mount, fetches available dates for all slots in parallel via `Promise.all(slots.map(s => getUpcomingBookableDates(s.slot_id)))`.
2. Merges results into a single `Map<string, { slotId, startTime, label }>` keyed by `YYYY-MM-DD`. If two slots produce the same date (e.g., two Monday slots at different times), the first slot in the array wins — last-write-wins is avoided by checking `map.has(date)` before inserting.
3. Passes two modifier sets to `react-day-picker`:
   - `available` — dates present in the map (highlighted, clickable)
   - `disabled` — all other dates (greyed out, not clickable)
4. On date selection, resolves `slotId` and `startTime` from the map and shows a confirmation strip below the calendar.
5. The confirm button only appears after a date is selected. Calls `onConfirm(slotId, date)` on click.
6. When `showAutoConfirmBadge` is true, dates within 2 calendar days show an amber "Will be auto-confirmed" badge in the confirmation strip.

### Loading state

While dates are loading, the calendar renders with all days disabled and a spinner overlay. Fetch errors show an inline error message with no calendar.

### Empty state

If no dates are available across all slots (map is empty after fetch), show: "No available dates in the next 20 weeks. Contact us directly."

---

## Styling

`react-day-picker` CSS variables are overridden to match V3 design tokens:

| State | Treatment |
|---|---|
| Available date | `background: #fef2f2`, `border: 1px solid #fecaca`, `color: #c8102e`, bold |
| Selected date | `background: #c8102e`, `color: #fff` |
| Disabled date | Muted grey, `cursor: default` |
| Today | Subtle underline only — no fill |
| Nav arrows | shadcn `Button variant="ghost"` + lucide `ChevronLeft` / `ChevronRight` |

Calendar width is `fit-content` to avoid stretching inside the modal. On `BookingPage` it sits inside the existing `max-w-sm` centered card.

---

## Confirmation strip

Appears below the calendar once a date is selected:

- Date formatted as "Thursday, May 14"
- Slot label + start time formatted as "Trial Class · 4:00 – 6:00 PM"
- Red checkmark badge
- When `showAutoConfirmBadge` is true and the date is within 2 days: amber "Will be auto-confirmed" badge

---

## Integration changes

### BookingPage

- Remove the `datePickerSection` JSX block (the scrollable date button list) and the slot-selector pill row.
- Remove the `selectedSlotId` / `dateOptions` state and the two `useEffect` hooks that drove them.
- Replace with `<BookingCalendar slots={slots} onConfirm={handleBook} submitting={submitting} />`.
- `handleBook` signature changes to `(slotId, date) => Promise<void>` — same payload sent to the `book-appointment` edge function.
- `slots` is still fetched in the same existing `useEffect`.

### PickDateModal

- Remove the scrollable date button list, slot-selector pills, `dateOptions` state, and the `useEffect` that fetched dates per slot.
- Replace with `<BookingCalendar slots={slots} onConfirm={handleConfirm} submitting={loading} confirmLabel="Confirm Appointment" showAutoConfirmBadge />`.
- `handleConfirm` signature changes to `(slotId, date) => Promise<void>`.
- `slots` is still fetched in the same existing `useEffect`.
- Dialog footer Cancel button and error display remain unchanged.

---

## Dependency

Install `react-day-picker` (v9, compatible with React 19):

```bash
npm install react-day-picker
```

No other new dependencies.

---

## Out of scope

- No changes to the admin `AdminAvailabilitySettings` — slot configuration UI is not affected.
- No changes to backend RPCs or edge functions.
- No changes to email templates or the booking token flow.
- The `ContactPage` form is not affected.
