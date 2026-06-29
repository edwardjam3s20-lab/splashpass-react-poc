import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { getBookingsByEmail } from '../lib/bookings'
import type { Booking } from '../types/database'

import { isBookingMissed } from '../lib/bookingCost'

function statusBadge(booking: Booking) {
  if (booking.status === 'completed') return { label: 'Completed', bg: 'rgba(48,209,88,0.12)', color: '#1F8A41' }
  if (booking.status === 'cancelled') return { label: 'Cancelled', bg: 'rgba(255,59,48,0.1)', color: '#FF3B30' }
  if (booking.status === 'rejected') return { label: 'Declined', bg: 'rgba(255,59,48,0.1)', color: '#FF3B30' }
  if (booking.status === 'pending') return { label: 'Pending', bg: 'rgba(255,159,10,0.12)', color: '#B25A00' }
  if (isBookingMissed(booking.date, booking.time, booking.status)) {
    return { label: 'Missed', bg: 'rgba(174,174,178,0.18)', color: '#6E6E73' }
  }
  return { label: 'Upcoming', bg: 'rgba(10,132,255,0.1)', color: '#0A84FF' }
}

function BookingCard({ booking, onViewPass }: { booking: Booking; onViewPass: (id: string) => void }) {
  const badge = statusBadge(booking)
  const carInfo = `${booking.car_make ?? ''} ${booking.car_model ?? ''}`.trim()
  const canViewPass = booking.status === 'confirmed' && !isBookingMissed(booking.date, booking.time, booking.status)

  return (
    <div
      className="rounded-[16px] bg-white p-4 mb-2.5"
      style={{ border: '1px solid #EBEBED', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[11px] text-base"
            style={{ background: '#E0FAF9' }}
          >
            💧
          </div>
          <div>
            <div className="text-[14px] font-bold text-ink">{booking.location}</div>
            <div className="text-[11px] text-muted mt-0.5">{booking.service_name || '—'}</div>
          </div>
        </div>
        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
      </div>

      <div className="flex items-center gap-4 pt-2.5" style={{ borderTop: '1px solid #F5F5F7' }}>
        <div className="flex-1">
          <div className="text-[10px] text-muted mb-0.5">Date &amp; Time</div>
          <div className="text-[12px] font-semibold text-ink">{booking.date} · {booking.time}</div>
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-muted mb-0.5">Vehicle</div>
          <div className="text-[12px] font-semibold text-ink">{carInfo || '—'} · {booking.car_plate || '—'}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[10px] text-muted mb-0.5">Amount</div>
          <div className="text-[13px] font-extrabold" style={{ color: '#0A84FF' }}>
            KSh {booking.total_amount?.toLocaleString() ?? '—'}
          </div>
        </div>
      </div>

      {canViewPass && (
        <button
          onClick={() => onViewPass(String(booking.id))}
          className="sp-press mt-3 w-full rounded-[12px] py-2.5 text-[13px] font-bold text-white flex items-center justify-center gap-1.5"
          style={{ background: '#0A1628' }}
        >
          <span>▦</span> View Pass
        </button>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-[16px] bg-white p-4 mb-2.5" style={{ border: '1px solid #EBEBED' }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="sp-skeleton h-9 w-9 rounded-[11px] flex-shrink-0" />
        <div className="flex-1">
          <div className="sp-skeleton h-4 w-32 mb-1.5 rounded" />
          <div className="sp-skeleton h-3 w-20 rounded" />
        </div>
      </div>
      <div className="sp-skeleton h-3 w-full rounded" />
    </div>
  )
}

type FilterKey = 'all' | 'upcoming' | 'missed' | 'completed' | 'cancelled'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'missed', label: 'Missed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export function BookingsScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(!!currentUser?.email)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')

  useEffect(() => {
    if (!currentUser?.email) return
    let cancelled = false
    setIsLoading(true)
    getBookingsByEmail(currentUser.email)
      .then((data) => { if (!cancelled) setBookings(data) })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load bookings.') })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [currentUser])

  const filtered = bookings.filter((b) => {
    if (filter === 'all') return true
    const missed = isBookingMissed(b.date, b.time, b.status)
    if (filter === 'upcoming') return (b.status === 'accepted' || b.status === 'confirmed') && !missed
    if (filter === 'missed') return missed
    return b.status === filter
  })

  return (
    <div style={{ background: '#F5F5F7', minHeight: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div className="bg-white px-5 pt-4 pb-4" style={{ boxShadow: '0 1px 0 #EBEBED' }}>
        <div className="text-[20px] font-extrabold text-ink mb-3" style={{ letterSpacing: '-0.4px' }}>
          Bookings
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="sp-press flex-shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold"
              style={{
                background: filter === f.key ? '#0A84FF' : '#F5F5F7',
                color: filter === f.key ? '#fff' : '#6E6E73',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-3">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">⚠️</div>
            <div className="text-[15px] font-bold text-ink mb-1">Couldn't load bookings</div>
            <div className="text-[13px] text-muted">{error}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🧾</div>
            <div className="text-[15px] font-bold text-ink mb-1">
              {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
            </div>
            <div className="text-[13px] text-muted mb-4">
              {filter === 'all' ? 'Your wash history will show up here.' : 'Try a different filter.'}
            </div>
            {filter === 'all' && (
              <button
                onClick={() => navigate('/discover')}
                className="sp-press rounded-[11px] px-4 py-2.5 text-[13px] font-bold text-white"
                style={{ background: '#0A84FF' }}
              >
                Browse Wash Points
              </button>
            )}
          </div>
        ) : (
          filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onViewPass={(id) => navigate(`/qr/${id}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}
