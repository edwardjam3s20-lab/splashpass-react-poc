import { supabase } from './supabase'
import type { Booking } from '../types/database'

export async function getBookingsByDate(date: string): Promise<Booking[]> {
  const { data, error } = await supabase.from('bookings').select('*').eq('date', date)
  if (error) throw error
  return data as Booking[]
}

export async function getBookingsByEmail(email: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_email', email)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Booking[]
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const { data, error } = await supabase.from('bookings').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return (data as Booking) ?? null
}

/**
 * Generates a booking code that's actually checked against the database,
 * not just assumed unique. The previous version used `Math.random()` (not
 * cryptographically seeded) with no collision check at all — rare, but a
 * real risk that silently corrupted a customer's QR pass if it ever hit.
 * `crypto.randomUUID()` is well-distributed entropy; the loop below is a
 * belt-and-suspenders check against the table itself, so even an
 * astronomically unlikely collision gets caught and retried rather than
 * trusted blindly.
 */
export async function generateUniqueBookingCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const raw = crypto.randomUUID().replace(/-/g, '').toUpperCase()
    const code = 'SP' + raw.slice(0, 6)
    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_code', code)
      .maybeSingle()
    if (error) throw error
    if (!data) return code
  }
  // Practically unreachable, but fail loudly rather than silently return a
  // possibly-colliding code if every attempt above somehow collided.
  throw new Error('Could not generate a unique booking code. Please try again.')
}

// splashmain is this project's separate backend deployment — see
// lib/mpesa.ts and lib/auth.ts for the same cross-origin pattern already
// in use. Booking creation moved here (rather than a direct Supabase
// insert) because creating a booking now needs a server-side side effect
// — looking up the wash point's operator(s) and sending them a push
// notification — which a client-side insert has no way to trigger.
const SPLASHMAIN_BASE = import.meta.env.VITE_SPLASHMAIN_URL || 'https://splashmain.vercel.app'

export async function createBooking(
  booking: Omit<Booking, 'id' | 'created_at'>
): Promise<Booking> {
  const res = await fetch(`${SPLASHMAIN_BASE}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Failed to create booking.')
  return data.booking as Booking
}

export async function getBookingPaymentStatus(
  bookingId: string
): Promise<'pending' | 'paid' | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('payment_status')
    .eq('id', bookingId)
    .maybeSingle()
  if (error || !data) return null
  return data.payment_status ?? null
}

/**
 * Commission split fallback — mirrors the original inline fallback used
 * whenever `window.SplashPassCommission` (an external script not present in
 * the original index.html) isn't loaded: 80% to the operator, 20% platform.
 * Swap this out for the real tiered logic if/when that script is ported.
 */
export function splitWashPrice(washPrice: number, tier = 1) {
  return {
    operatorAmount: Math.round(washPrice * 0.8),
    platformAmount: Math.round(washPrice * 0.2),
    tier,
  }
}
