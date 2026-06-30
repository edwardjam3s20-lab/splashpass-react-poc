// lib/washPoints.ts
// Extended with:
//   - fetchWashPointsInBounds(bbox)  — viewport-aware fetching
//   - fetchRatingSummaries()         — batch-fetch avg_rating + review_count
//   - WashPointRating type exported for consumers

import { supabase } from '../lib/supabase'
import type { WashPoint, WashPointExtra, WashPointRow, OperatorStatus } from '../types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WashPointRating {
  wash_point_id: string
  avg_rating: number     // 1.0–5.0, rounded to 1 dp
  review_count: number
}

export interface LatLngBounds {
  swLat: number
  swLng: number
  neLat: number
  neLng: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function distKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Normalise a raw Supabase row + its services into the app's WashPoint shape.
function normalise(r: WashPointRow, servicesByPoint: WashPointExtra[]): WashPoint {
  return {
    id: r.id,
    name: r.name,
    area: r.area,
    lat: parseFloat(String(r.lat)),
    lng: parseFloat(String(r.lng)),
    description: r.description ?? null,
    image_url: r.image_url ?? null,
    status: r.status ?? 'open',
    services: servicesByPoint.filter((s) => s.wash_point_id === r.id),
    commission_tier: r.commission_tier != null ? Number(r.commission_tier) : 1,
    opens_at: r.opens_at ?? '07:00',
    closes_at: r.closes_at ?? '21:00',
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches ALL wash points (used on first load and when no bounds are known).
 * Unchanged from original — keeps existing callers (HomeScreen, etc.) working.
 */
export async function fetchWashPoints(): Promise<WashPoint[]> {
  const { data: rows, error: pointsError } = await supabase
    .from('wash_points')
    .select('*')
    .order('name', { ascending: true })

  if (pointsError) throw pointsError

  const { data: services } = await supabase
    .from('wash_point_extras')
    .select('*')
    .order('price', { ascending: true })

  const servicesByPoint = (services ?? []) as WashPointExtra[]
  return ((rows ?? []) as WashPointRow[]).map((r) => normalise(r, servicesByPoint))
}

/**
 * Fetches only wash points whose (lat, lng) falls inside the given bounding
 * box. Used by the Discovery screen's viewport-aware re-fetch — only loads
 * what the user can actually see, scales to large datasets.
 *
 * Supabase/PostgREST doesn't have a native bounding-box filter, but a
 * simple four-condition range query on the indexed lat/lng columns is fast
 * enough for a few thousand wash points and avoids PostGIS dependency.
 *
 * If the wash_points table grows to tens of thousands of rows, add a
 * PostGIS geography column and switch this to ST_MakeEnvelope.
 */
export async function fetchWashPointsInBounds(bounds: LatLngBounds): Promise<WashPoint[]> {
  // Add a small padding (0.01° ≈ 1 km) so markers near the edge aren't
  // clipped when the user pans slightly.
  const PAD = 0.01
  const { swLat, swLng, neLat, neLng } = bounds

  const { data: rows, error } = await supabase
    .from('wash_points')
    .select('*')
    .gte('lat', swLat - PAD)
    .lte('lat', neLat + PAD)
    .gte('lng', swLng - PAD)
    .lte('lng', neLng + PAD)

  if (error) throw error
  if (!rows || rows.length === 0) return []

  const pointIds = (rows as WashPointRow[]).map((r) => r.id)

  const { data: services } = await supabase
    .from('wash_point_extras')
    .select('*')
    .in('wash_point_id', pointIds)
    .order('price', { ascending: true })

  const servicesByPoint = (services ?? []) as WashPointExtra[]
  return (rows as WashPointRow[]).map((r) => normalise(r, servicesByPoint))
}

/**
 * Fetches the aggregate rating summary (avg_rating, review_count) for every
 * wash point from the `wash_point_rating_summary` view created by
 * wash_point_ratings.sql. Returns a map keyed by wash_point_id for O(1)
 * lookup when merging into the points list.
 */
export async function fetchRatingSummaries(): Promise<Map<string, WashPointRating>> {
  const { data, error } = await supabase
    .from('wash_point_rating_summary')
    .select('wash_point_id, avg_rating, review_count')

  if (error) {
    // Rating data is non-critical — log but don't throw so the Discovery
    // screen still loads even if the ratings migration hasn't run yet.
    console.warn('[SplashPass] Could not load ratings:', error.message)
    return new Map()
  }

  const map = new Map<string, WashPointRating>()
  ;(data ?? []).forEach((row) => {
    map.set(row.wash_point_id, {
      wash_point_id: row.wash_point_id,
      avg_rating: Number(row.avg_rating),
      review_count: Number(row.review_count),
    })
  })
  return map
}

/**
 * Fetches the live open/paused status for every operator. Unchanged.
 */
export async function fetchOperatorStatuses(): Promise<Record<string, 'open' | 'paused'>> {
  const { data, error } = await supabase.from('operators').select('wash_point, status')

  if (error) return {}

  const map: Record<string, 'open' | 'paused'> = {}
  ;(data as OperatorStatus[] | null)?.forEach((o) => {
    map[o.wash_point] = o.status
  })
  return map
}
