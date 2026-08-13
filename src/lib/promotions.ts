// lib/promotions.ts
//
// Reads from promotions_public — same pattern as fetchWashPoints reading
// wash_points_public (see lib/washPoints.ts): a curated, anon-readable
// view that only ever exposes currently-active promotions (the view's
// WHERE clause already filters on active/starts_at/ends_at, so nothing
// client-side needs to re-check that).

import { supabase } from './supabase'

export interface Promotion {
  id: string
  wash_point_id: string
  wash_point_name: string
  wash_point_extra_id: string | null
  service_name: string | null
  title: string
  description: string | null
  discount_type: 'percent' | 'fixed'
  discount_value: number
  starts_at: string
  ends_at: string | null
}

function normalise(r: any): Promotion {
  return {
    id: r.id,
    wash_point_id: r.wash_point_id,
    wash_point_name: r.wash_point_name,
    wash_point_extra_id: r.wash_point_extra_id ?? null,
    service_name: r.service_name ?? null,
    title: r.title,
    description: r.description ?? null,
    discount_type: r.discount_type,
    discount_value: Number(r.discount_value),
    starts_at: r.starts_at,
    ends_at: r.ends_at ?? null,
  }
}

/** All currently-active promotions app-wide — used for a "Deals" section on Home/Discovery. */
export async function fetchActivePromotions(): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from('promotions_public')
    .select('*')
    .order('discount_value', { ascending: false })

  if (error) {
    console.error('fetchActivePromotions error:', error.message)
    return []
  }
  return (data || []).map(normalise)
}

/** Active promotions for one washpoint — used on BookScreen to show a banner and preview the discounted price. */
export async function fetchPromotionsForWashPoint(washPointId: string): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from('promotions_public')
    .select('*')
    .eq('wash_point_id', washPointId)

  if (error) {
    console.error('fetchPromotionsForWashPoint error:', error.message)
    return []
  }
  return (data || []).map(normalise)
}

/**
 * Client-side preview only — mirrors lib/promotions.js's
 * applyPromotionDiscount on the server, which is the actual authority on
 * what a customer pays. This exists purely so BookScreen can show the
 * discounted price before the booking is created; the server re-derives
 * and re-applies the real discount itself at booking time regardless of
 * what the client displayed.
 */
export function applyPromotionDiscount(price: number, promotion: Promotion | null): number {
  if (!promotion) return price
  const raw = promotion.discount_type === 'percent'
    ? price * (1 - promotion.discount_value / 100)
    : price - promotion.discount_value
  return Math.max(0, Math.round(raw))
}

/** Picks the best-matching promo for a service: service-specific wins over washpoint-wide. Mirrors lib/promotions.js's findActivePromotion priority. */
export function pickBestPromotion(promotions: Promotion[], washPointExtraId: string | null): Promotion | null {
  const serviceSpecific = promotions.find((p) => p.wash_point_extra_id === washPointExtraId)
  if (serviceSpecific) return serviceSpecific
  return promotions.find((p) => p.wash_point_extra_id === null) || null
}
