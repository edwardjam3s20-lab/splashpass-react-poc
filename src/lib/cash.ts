import { apiFetch } from './tokenRefresh'
import type { Booking } from '../types/database'

const SPLASHMAIN_BASE = import.meta.env.VITE_SPLASHMAIN_URL || 'https://splashmain.vercel.app'

// Confirms a booking as "pay at the wash point, in cash" — no STK push, no
// wallet debit, nothing moves through the app at all. Only ever offered
// when booking.cash_eligible is true (see MpesaBookingScreen), and the
// server independently re-checks eligibility rather than trusting that —
// see app/api/bookings/pay-cash/route.js.
export async function payBookingWithCash(
  bookingId: string
): Promise<{ ok: boolean; booking?: Booking; error?: string }> {
  try {
    const res = await apiFetch(`${SPLASHMAIN_BASE}/api/bookings/pay-cash`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data?.error || 'Could not confirm cash payment.' }
    return { ok: true, booking: data.booking }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong.' }
  }
}
