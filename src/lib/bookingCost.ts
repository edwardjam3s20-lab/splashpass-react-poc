import type { Profile, WashPointExtra } from '../types/database'
import type { Promotion } from './promotions'
import { applyPromotionDiscount } from './promotions'

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

// How long after the scheduled slot (or, for ASAP bookings, after the
// booking was created) a customer/operator has before it flips to Missed.
const MISSED_GRACE_PERIOD_MS = 15 * 60 * 1000 // 15 minutes

/**
 * True if a booking's scheduled date+time has passed — plus a 15-minute
 * grace period — while it's still sitting in 'accepted' or 'confirmed',
 * i.e. nobody ever marked it completed or cancelled. Computed at render
 * time rather than as a stored status, since flipping it for real would
 * need a cron job / scheduled function; this is purely a display-layer
 * correction so "Upcoming" doesn't keep showing for a booking whose grace
 * period has clearly elapsed.
 *
 * ASAP bookings have no real slot time (time === "ASAP"), so there's
 * nothing to add a grace period to — instead the grace period is measured
 * from `createdAt` (when the booking was made). Without `createdAt`, an
 * ASAP booking is never considered missed, rather than guessing.
 */
export function isBookingMissed(
  date: string,
  time: string,
  status: string,
  createdAt?: string | null
): boolean {
  if (status !== 'accepted' && status !== 'confirmed') return false

  if (isAsapSlot(time)) {
    if (!createdAt) return false
    const created = new Date(createdAt).getTime()
    if (Number.isNaN(created)) return false
    return created + MISSED_GRACE_PERIOD_MS < Date.now()
  }

  const slot = parseSlotDateTime(date, time)
  return slot.getTime() + MISSED_GRACE_PERIOD_MS < Date.now()
}

function isAsapSlot(time: string): boolean {
  return time.trim().toUpperCase() === 'ASAP'
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
  /** Pre-discount price, only differs from washPrice when a promotion is applied. */
  originalWashPrice: number
}

/**
 * Freemium model: no per-booking fee, ever — trial or subscribed, the
 * customer only ever pays the wash price itself (mirrors the backend's
 * app/api/bookings/route.js, which hardcodes appFee to 0 and derives
 * washPrice from the DB regardless of what a client sends). `appFee` is
 * kept in the return shape only so callers that still read `cost.appFee`
 * don't need touching; they'll always see 0.
 *
 * `promotion` is a client-side preview only — the server independently
 * re-derives and applies the real active promotion at booking time (see
 * app/api/bookings/route.js), so this can never be the actual source of
 * truth for what gets charged. It exists so the customer sees the
 * discounted price before confirming, not after.
 */
export function calculateBookingCost(
  service: WashPointExtra | null,
  _user: Profile | null,
  promotion?: Promotion | null
): BookingCost {
  const originalWashPrice = service ? Number(service.price) : 0
  const washPrice = promotion ? applyPromotionDiscount(originalWashPrice, promotion) : originalWashPrice
  const appFee = 0
  const total = washPrice + appFee
  return { washPrice, appFee, total, originalWashPrice }
}
