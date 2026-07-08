import { supabase } from './supabase'
import type { Booking } from '../types/database'

// Only the columns needed for public queue/full-slot display — never the
// full row. Previously `select('*')` here returned every booking's name,
// phone, car plate, and pricing for anyone browsing a date, to any visitor
// with the anon key (this is queried before login, so it has to stay
// world-readable — but "world-readable" and "world-readable in full" are
// different things). Matches the column-level grant in
// supabase/bookings_queue_columns.sql — if you need another column here,
// add it to that GRANT first or this will start erroring.
export async function getBookingsByDate(date: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, date, time, location, status')
    .eq('date', date)
  if (error) throw error
  return data as Booking[]
}

// Reads the caller's OWN bookings via the session cookie rather than
// hitting Supabase directly with an arbitrary email — see
// app/api/customer/bookings/route.js in splashmain. The `email` param is
// kept for now to avoid touching every call site, but it's no longer used
// for the actual lookup (the server derives it from the session); every
// real caller already only ever passes currentUser.email anyway.
export async function getBookingsByEmail(_email: string): Promise<Booking[]> {
  const res = await fetch(`${SPLASHMAIN_BASE}/api/customer/bookings`, { credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Failed to load bookings.')
  return (data.bookings ?? []) as Booking[]
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const res = await fetch(`${SPLASHMAIN_BASE}/api/customer/bookings?id=${encodeURIComponent(id)}`, {
    credentials: 'include',
  })
  if (res.status === 404) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Failed to load booking.')
  return (data.booking as Booking) ?? null
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
  // credentials: 'include' is required now that /api/bookings checks the
  // session — without it, the splashmain session cookie (set on login)
  // never gets attached to this cross-origin request, and every booking
  // would 401. Pricing/identity fields in `booking` (user_email,
  // wash_price, total_amount, etc.) are still sent for backward
  // compatibility but the server now ignores them and derives everything
  // from the session + the actual wash point/service rows instead.
  const res = await fetch(`${SPLASHMAIN_BASE}/api/bookings`, {
    method: 'POST',
    credentials: 'include',
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
  const booking = await getBookingById(bookingId)
  return booking?.payment_status ?? null
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
