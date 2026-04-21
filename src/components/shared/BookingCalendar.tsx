import { useState, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import './booking-calendar.css'
import { Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { getUpcomingBookableDates } from '../../lib/supabase/queries'
import type { AppointmentSlot } from '../../lib/types'

interface DateOption {
  slotId: string
  startTime: string
  label: string
}

interface BookingCalendarProps {
  slots: AppointmentSlot[]
  onConfirm: (slotId: string, date: string) => Promise<void>
  submitting: boolean
  confirmLabel?: string
  showAutoConfirmBadge?: boolean
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatTime(timeStr: string): string {
  return new Date('1970-01-01T' + timeStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function isWithin2Days(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) < 2
}

export function BookingCalendar({
  slots,
  onConfirm,
  submitting,
  confirmLabel = 'Confirm Booking',
  showAutoConfirmBadge = false,
}: BookingCalendarProps) {
  const [availableMap, setAvailableMap] = useState<Map<string, DateOption>>(new Map())
  const [fetching, setFetching] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Date | undefined>()
  const slotIds = slots.map(s => s.slot_id).join(',')

  useEffect(() => {
    if (slots.length === 0) { setFetching(false); return }
    let cancelled = false
    Promise.all(
      slots.map(s =>
        getUpcomingBookableDates(s.slot_id).then(dates => ({ slot: s, dates }))
      )
    )
      .then(results => {
        if (cancelled) return
        const map = new Map<string, DateOption>()
        for (const { slot, dates } of results) {
          for (const date of dates) {
            if (!map.has(date)) {
              map.set(date, { slotId: slot.slot_id, startTime: slot.start_time, label: slot.label })
            }
          }
        }
        setAvailableMap(map)
      })
      .catch(() => { if (!cancelled) setFetchError('Failed to load available dates. Please refresh.') })
      .finally(() => { if (!cancelled) setFetching(false) })
    return () => { cancelled = true }
  }, [slotIds])

  const availableDates = Array.from(availableMap.keys()).map(d => new Date(d + 'T12:00:00'))
  const selectedKey = selected ? toDateKey(selected) : null
  const selectedOption = selectedKey ? availableMap.get(selectedKey) : null

  async function handleConfirm() {
    if (!selectedKey || !selectedOption) return
    await onConfirm(selectedOption.slotId, selectedKey)
  }

  if (fetching) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (fetchError) {
    return <p className="text-sm text-destructive text-center py-4">{fetchError}</p>
  }

  if (availableMap.size === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No available dates in the next 20 weeks. Contact us directly.
      </p>
    )
  }

  return (
    <div className="booking-calendar">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={setSelected}
        disabled={(date) => !availableMap.has(toDateKey(date))}
        modifiers={{ available: availableDates }}
        modifiersClassNames={{ available: 'rdp-day_available' }}
        showOutsideDays={false}
      />

      {selected && selectedOption && (
        <div className="mt-3 p-3 rounded-lg border-2 border-primary bg-primary/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sm text-foreground">
                {selected.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {selectedOption.label} · {formatTime(selectedOption.startTime)}
              </div>
            </div>
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs leading-none">✓</span>
            </div>
          </div>
          {showAutoConfirmBadge && isWithin2Days(selected) && (
            <span className="inline-block mt-1.5 px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-800 border border-amber-200">
              Will be auto-confirmed
            </span>
          )}
        </div>
      )}

      {selected && (
        <Button
          onClick={handleConfirm}
          disabled={!selectedOption || submitting}
          className="w-full mt-3"
        >
          {submitting
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Confirming…</>
            : confirmLabel}
        </Button>
      )}
    </div>
  )
}
