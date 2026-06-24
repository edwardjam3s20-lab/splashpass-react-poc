import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBookingPaymentStatus } from '../lib/bookings'

const MAX_ATTEMPTS = 12 // same ceiling as the original (12 attempts x 5s = 60s)
const POLL_INTERVAL_MS = 5000

/**
 * Polls a booking's payment_status every 5s via React Query's refetchInterval,
 * stopping either when payment is confirmed or after MAX_ATTEMPTS — replacing
 * the original's manual setInterval/clearInterval/attempts-counter pattern.
 *
 * Attempts are tracked with a plain ref rather than a React Query internal
 * field: `dataUpdateCount` exists on the query cache's internal state but is
 * not part of the public UseQueryResult type, so relying on it doesn't
 * type-check against the published API.
 */
export function useBookingPaymentPoll(bookingId: string | undefined, enabled: boolean) {
  const attemptsRef = useRef(0)
  const [timedOut, setTimedOut] = useState(false)

  // Reset attempt tracking whenever polling is (re)enabled
  useEffect(() => {
    if (enabled) {
      attemptsRef.current = 0
      setTimedOut(false)
    }
  }, [enabled])

  const query = useQuery({
    queryKey: ['booking-payment-status', bookingId],
    queryFn: async () => {
      const result = await getBookingPaymentStatus(bookingId as string)
      attemptsRef.current += 1
      if (result !== 'paid' && attemptsRef.current >= MAX_ATTEMPTS) {
        setTimedOut(true)
      }
      return result
    },
    enabled: enabled && Boolean(bookingId) && !timedOut,
    refetchInterval: (q) => (q.state.data === 'paid' ? false : POLL_INTERVAL_MS),
  })

  return { isPaid: query.data === 'paid', timedOut, isLoading: query.isLoading }
}
