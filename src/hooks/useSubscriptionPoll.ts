import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUserByEmail } from '../lib/auth'

const MAX_ATTEMPTS = 12
const POLL_INTERVAL_MS = 5000

/**
 * Polls the user's profile row for sub_status === 'active' after a
 * subscription STK push, mirrors the subscription branch of the original
 * triggerSTK() — same attempt-ceiling pattern as useBookingPaymentPoll,
 * just watching a different table/column.
 */
export function useSubscriptionPoll(email: string | undefined, enabled: boolean) {
  const attemptsRef = useRef(0)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (enabled) {
      attemptsRef.current = 0
      setTimedOut(false)
    }
  }, [enabled])

  const query = useQuery({
    queryKey: ['subscription-status', email],
    queryFn: async () => {
      const profile = await getUserByEmail(email as string)
      attemptsRef.current += 1
      if (profile?.sub_status !== 'active' && attemptsRef.current >= MAX_ATTEMPTS) {
        setTimedOut(true)
      }
      return profile
    },
    enabled: enabled && Boolean(email) && !timedOut,
    refetchInterval: (q) => (q.state.data?.sub_status === 'active' ? false : POLL_INTERVAL_MS),
  })

  return {
    isActive: query.data?.sub_status === 'active',
    activatedProfile: query.data ?? null,
    timedOut,
  }
}
