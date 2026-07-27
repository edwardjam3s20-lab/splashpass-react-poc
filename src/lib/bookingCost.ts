import type { Profile, WashPointExtra } from '../types/database'

/**
 * Generates hourly slot labels between a wash point's opens_at/closes_at
 * (e.g. "07:00"–"21:00" → 7:00 AM .. 8:00 PM, one slot per hour, the
 * closing hour itself excluded since a wash starting exactly at close
 * isn't realistic). Replaces the previous fixed 7AM-5PM SLOTS constant,
 * which was wrong for any wash point with different hours — operating
 * hours are now a real per-wash-point field (see wash_point_hours.sql).
 *
 * When `date` is today, slots whose hour has already passed are excluded
 * — there's no reason to offer a 2pm slot at 3pm. Dates other than today
 * return the full range regardless of current time.
 */
export function generateSlots(opensAt: string, closesAt: string, date?: string): string[] {
  const [openH] = opensAt.split(':').map(Number)
  const [closeH] = closesAt.split(':').map(Number)

  const isToday = date ? date === todayISO() : false
  const currentHour = new Date().getHours()

  const slots: string[] = []
  for (let h = openH; h < closeH; h++) {
    if (isToday && h <= currentHour) continue
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    slots.push(`${h12}:00 ${ampm}`)
  }
  return slots
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * True if a booking's scheduled date+time has passed while it's still
 * sitting in 'accepted' or 'confirmed' — i.e. nobody ever marked it
 * completed or cancelled, and the slot it was for is now in the past.
 * Computed at render time rather than as a stored status, since flipping
 * it for real would need a cron job / scheduled function; this is purely
 * a display-layer correction so "Upcoming" doesn't keep showing for a
 * booking whose time has clearly already gone by.
 */
export function isBookingMissed(date: string, time: string, status: string): boolean {
  if (status !== 'accepted' && status !== 'confirmed') return false
  const slot = parseSlotDateTime(date, time)
  return slot.getTime() < Date.now()
}

function parseSlotDateTime(date: string, time: string): Date {
  // time is like "5:00 PM" — convert to a real Date for comparison.
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return new Date(date) // fall back to midnight if unparseable
  const [, hStr, mStr, ampm] = match
  let h = parseInt(hStr, 10)
  if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12
  if (ampm.toUpperCase() === 'AM' && h === 12) h = 0
  const d = new Date(date)
  d.setHours(h, parseInt(mStr, 10), 0, 0)
  return d
}

export interface BookingCost {
  washPrice: number
  appFee: number
  total: number
}

/**
 * Freemium model: no per-booking fee, ever — trial or subscribed, the
 * customer only ever pays the wash price itself (mirrors the backend's
 * app/api/bookings/route.js, which hardcodes appFee to 0 and derives
 * washPrice from the DB regardless of what a client sends). `appFee` is
 * kept in the return shape only so callers that still read `cost.appFee`
 * don't need touching; they'll always see 0.
 */
export function calculateBookingCost(
  service: WashPointExtra | null,
  _user: Profile | null
): BookingCost {
  const washPrice = service ? Number(service.price) : 0
  const appFee = 0
  const total = washPrice + appFee
  return { washPrice, appFee, total }
}
