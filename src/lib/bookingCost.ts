import { isOnTrial } from './access'
import type { Profile, WashPointExtra } from '../types/database'

export const SLOTS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
]

export const APP_BOOKING_FEE = 30 // KSh fee per booking during trial

export interface BookingCost {
  washPrice: number
  appFee: number
  total: number
}

/**
 * Mirrors updateBookingCost(). Loyalty tier discounts are intentionally
 * omitted here — that depends on the /api/loyalty/status endpoint and the
 * loyalty feature isn't ported yet, so this always behaves as if a user
 * has no loyalty discount (same as the original before that endpoint
 * resolves).
 */
export function calculateBookingCost(
  service: WashPointExtra | null,
  user: Profile | null
): BookingCost {
  const washPrice = service ? Number(service.price) : 0
  const onTrial = isOnTrial(user)
  const appFee = onTrial && washPrice > 0 ? APP_BOOKING_FEE : 0
  const total = washPrice + appFee
  return { washPrice, appFee, total }
}
