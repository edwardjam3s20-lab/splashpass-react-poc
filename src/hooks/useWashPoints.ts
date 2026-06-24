import { useQuery } from '@tanstack/react-query'
import { fetchWashPoints, fetchOperatorStatuses, distKm } from '../lib/washPoints'
import type { WashPoint } from '../types/database'

export function useWashPoints() {
  return useQuery({
    queryKey: ['wash-points'],
    queryFn: fetchWashPoints,
    staleTime: 60_000, // wash points rarely change; avoid refetching on every screen visit
  })
}

export function useOperatorStatuses() {
  return useQuery({
    queryKey: ['operator-statuses'],
    queryFn: fetchOperatorStatuses,
    // operators flip open/paused live — keep this fresher than wash point data
    refetchInterval: 30_000,
  })
}

/**
 * Combines wash points + live operator statuses + distance from the user,
 * sorted nearest-first. Mirrors the original `sortAndRenderPoints()`.
 */
export function useSortedWashPoints(userLat: number, userLng: number): {
  points: WashPoint[]
  isLoading: boolean
} {
  const { data: washPoints, isLoading: pointsLoading } = useWashPoints()
  const { data: statuses, isLoading: statusesLoading } = useOperatorStatuses()

  if (!washPoints) return { points: [], isLoading: pointsLoading || statusesLoading }

  const sorted = washPoints
    .map((p) => ({
      ...p,
      dist: distKm(userLat, userLng, p.lat, p.lng),
      status: statuses?.[p.name] ?? p.status,
    }))
    .sort((a, b) => a.dist - b.dist)

  return { points: sorted, isLoading: pointsLoading || statusesLoading }
}
