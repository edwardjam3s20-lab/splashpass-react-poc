import { useQuery } from '@tanstack/react-query'
import { getBookingsByDate } from '../lib/bookings'

export function useFullSlots(date: string, pointName: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ['bookings-by-date', date],
    queryFn: () => getBookingsByDate(date),
    enabled: Boolean(date),
  })

  const fullSlots = new Set<string>()
  if (data && pointName) {
    const counts: Record<string, number> = {}
    data
      .filter((b) => b.location === pointName && b.status !== 'cancelled')
      .forEach((b) => {
        counts[b.time] = (counts[b.time] ?? 0) + 1
      })
    Object.entries(counts).forEach(([time, count]) => {
      if (count >= 2) fullSlots.add(time)
    })
  }

  return { fullSlots, isLoading }
}
