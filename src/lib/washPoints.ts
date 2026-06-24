import { supabase } from '../lib/supabase'
import type { WashPoint, WashPointExtra, WashPointRow, OperatorStatus } from '../types/database'

export async function fetchWashPoints(): Promise<WashPoint[]> {
  const { data: rows, error: pointsError } = await supabase
    .from('wash_points')
    .select('*')
    .order('name', { ascending: true })

  if (pointsError) throw pointsError

  // Operator-defined services for all wash points, fetched in one call
  const { data: services } = await supabase
    .from('wash_point_extras')
    .select('*')
    .order('price', { ascending: true })

  const servicesByPoint = (services ?? []) as WashPointExtra[]

  return ((rows ?? []) as WashPointRow[]).map((r) => ({
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
  }))
}

export async function fetchOperatorStatuses(): Promise<Record<string, 'open' | 'paused'>> {
  const { data, error } = await supabase.from('operators').select('wash_point, status')

  if (error) return {}

  const map: Record<string, 'open' | 'paused'> = {}
  ;(data as OperatorStatus[] | null)?.forEach((o) => {
    map[o.wash_point] = o.status
  })
  return map
}

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
