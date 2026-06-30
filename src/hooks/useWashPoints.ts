// hooks/useWashPoints.ts
// Extended with:
//   useWashPointsInBounds(bounds)  — viewport-aware query, refetches when
//                                    bounds change significantly
//   useRatingSummaries()           — TanStack Query wrapper for rating data
//   useSortedWashPoints unchanged  — existing screens keep working

import { useQuery } from '@tanstack/react-query'
import {
  fetchWashPoints,
  fetchWashPointsInBounds,
  fetchOperatorStatuses,
  fetchRatingSummaries,
  distKm,
} from '../lib/washPoints'
import type { LatLngBounds, WashPointRating } from '../lib/washPoints'
import type { WashPoint } from '../types/database'

// ─── Existing hooks (unchanged API) ──────────────────────────────────────────

export function useWashPoints() {
  return useQuery({
    queryKey: ['wash-points'],
    queryFn: fetchWashPoints,
    staleTime: 60_000,
  })
}

export function useOperatorStatuses() {
  return useQuery({
    queryKey: ['operator-statuses'],
    queryFn: fetchOperatorStatuses,
    refetchInterval: 30_000,
  })
}

/**
 * Used by HomeScreen, BookScreen, etc. — unchanged behaviour.
 */
export function useSortedWashPoints(
  userLat: number,
  userLng: number
): { points: WashPoint[]; isLoading: boolean } {
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

// ─── New hooks ────────────────────────────────────────────────────────────────

/**
 * Fetches wash points visible in the current map viewport, re-fetching
 * automatically when the bounds change.
 *
 * `bounds` is null until the map fires its first moveend/zoomend — while null
 * the hook falls back to the full fetchWashPoints so the list isn't empty on
 * cold start.
 *
 * The query key includes all four bbox values so TanStack Query caches each
 * viewport separately (useful when the user pans back to a previous area)
 * and invalidates only when the bounds actually change.
 *
 * staleTime is lower than useWashPoints (10 s vs 60 s) because a viewport
 * change is a deliberate navigation gesture — the user expects fresh data.
 */
export function useWashPointsInBounds(
  bounds: LatLngBounds | null,
  userLat: number,
  userLng: number
): { points: WashPoint[]; isLoading: boolean; isFetching: boolean } {
  const { data: statuses } = useOperatorStatuses()

  // Bounds-aware query — only active once we have real bounds from the map.
  const boundsQuery = useQuery({
    queryKey: [
      'wash-points-bounds',
      bounds?.swLat?.toFixed(4),
      bounds?.swLng?.toFixed(4),
      bounds?.neLat?.toFixed(4),
      bounds?.neLng?.toFixed(4),
    ],
    queryFn: () => fetchWashPointsInBounds(bounds!),
    enabled: bounds !== null,
    staleTime: 10_000,
    // Keep previous data while new bounds are loading so the list doesn't
    // flash empty during a pan.
    placeholderData: (prev) => prev,
  })

  // Fallback: full fetch used while bounds aren't known yet (initial render).
  const fallbackQuery = useQuery({
    queryKey: ['wash-points'],
    queryFn: fetchWashPoints,
    staleTime: 60_000,
    enabled: bounds === null,
  })

  const rawPoints = bounds !== null
    ? (boundsQuery.data ?? [])
    : (fallbackQuery.data ?? [])

  const isLoading = bounds !== null ? boundsQuery.isLoading : fallbackQuery.isLoading
  const isFetching = bounds !== null ? boundsQuery.isFetching : fallbackQuery.isFetching

  // Merge live operator status + distance, sort nearest-first.
  const points = rawPoints
    .map((p) => ({
      ...p,
      dist: distKm(userLat, userLng, p.lat, p.lng),
      status: statuses?.[p.name] ?? p.status,
    }))
    .sort((a, b) => a.dist - b.dist)

  return { points, isLoading, isFetching }
}

/**
 * Loads the aggregate rating summary for all wash points from the
 * `wash_point_rating_summary` view. Returns a Map<wash_point_id, rating>.
 *
 * staleTime: 5 min — ratings change slowly; we don't need live accuracy here.
 * Failures are swallowed gracefully (fetchRatingSummaries never throws).
 */
export function useRatingSummaries(): Map<string, WashPointRating> {
  const { data } = useQuery({
    queryKey: ['wash-point-ratings'],
    queryFn: fetchRatingSummaries,
    staleTime: 5 * 60_000,
  })
  return data ?? new Map()
}
