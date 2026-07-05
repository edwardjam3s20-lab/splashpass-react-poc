// hooks/useLiveQueue.ts
//
// Live "how many cars are ahead of me right now" queue counts, per wash
// point, for a given date.
//
// The operator app and this customer app share one Supabase `bookings`
// table (see supabase/booking_lifecycle.sql, which already enables
// Realtime on it for exactly this reason). When an operator accepts,
// rejects, or completes a booking — or another customer joins the queue —
// this hook hears it immediately and refreshes, with no polling and no
// action needed from the person looking at the screen.
//
// Implementation note: this reuses the same ['bookings-by-date', date]
// query key as useFullSlots, so the two share one cache entry instead of
// fetching the same rows twice.

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getBookingsByDate } from '../lib/bookings'
import type { Booking } from '../types/database'

// A booking still counts as "in the queue" until the operator has marked
// it done (or it fell away via rejection/cancellation).
const ACTIVE_QUEUE_STATUSES = new Set<Booking['status']>(['pending', 'accepted'])

/**
 * Live queue length for every wash point on `date`, keyed by wash point
 * name (bookings store the wash point's name in `location`, not its id —
 * matching how useFullSlots already looks bookings up).
 *
 * Opens a single Realtime channel for the whole date rather than one per
 * wash point, so a Discovery screen with many pins still only holds one
 * subscription open.
 */
export function useLiveQueueCounts(date: string) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['bookings-by-date', date],
    queryFn: () => getBookingsByDate(date),
    enabled: Boolean(date),
    staleTime: 15_000,
  })

  useEffect(() => {
    if (!date) return

    const channel = supabase
      .channel(`live-queue-${date}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `date=eq.${date}` },
        () => {
          // Something changed for this date — a new booking came in, or the
          // operator app accepted/rejected/completed one. Refetch rather
          // than patch the cache by hand so this always matches the
          // server's truth, the same source PendingApprovalScreen trusts.
          queryClient.invalidateQueries({ queryKey: ['bookings-by-date', date] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [date, queryClient])

  const counts: Record<string, number> = {}
  ;(data ?? []).forEach((b) => {
    if (ACTIVE_QUEUE_STATUSES.has(b.status)) {
      counts[b.location] = (counts[b.location] ?? 0) + 1
    }
  })

  return { counts, isLoading }
}

/** Convenience wrapper when a screen only cares about one wash point. */
export function useLiveQueue(date: string, pointName: string | undefined) {
  const { counts, isLoading } = useLiveQueueCounts(date)
  return { queueCount: pointName ? (counts[pointName] ?? 0) : 0, isLoading }
}
