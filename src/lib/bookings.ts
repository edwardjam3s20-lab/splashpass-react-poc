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

export async function createBooking(
  booking: Omit<Booking, 'id' | 'created_at'>
): Promise<Booking> {
  const { data, error } = await supabase.from('bookings').insert(booking).select()
  if (error || !data?.[0]) throw error ?? new Error('Failed to create booking.')
  return data[0] as Booking
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
