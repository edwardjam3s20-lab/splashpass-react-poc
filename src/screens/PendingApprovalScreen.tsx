import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getBookingById } from '../lib/bookings'
import { useAppStore } from '../store/useAppStore'
import type { Booking } from '../types/database'

type Phase = 'loading' | 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'not_found' | 'error'

export function PendingApprovalScreen() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const setPendingBooking = useAppStore((s) => s.setPendingBooking)
  const pendingBookingCode = useAppStore((s) => s.pendingBooking?.code)
  const pendingBookingDate = useAppStore((s) => s.pendingBooking?.date)
  const showToast = useAppStore((s) => s.showToast)

  const [booking, setBooking] = useState<Booking | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [cancelling, setCancelling] = useState(false)
  // Guards against acting twice if a realtime event and a manual refetch
  // both resolve to the same status change in close succession.
  const settledRef = useRef(false)

  // Initial fetch — also doubles as the source of truth if the page is
  // refreshed mid-wait (the realtime subscription below only catches
  // changes from this point forward, not the current state).
  useEffect(() => {
    if (!bookingId) { setPhase('not_found'); return }
    let cancelled = false
    getBookingById(bookingId)
      .then((b) => {
        if (cancelled) return
        if (!b) { setPhase('not_found'); return }
        setBooking(b)
        if (b.status === 'pending') setPhase('pending')
        else if (b.status === 'accepted') setPhase('accepted')
        else if (b.status === 'rejected') setPhase('rejected')
        else if (b.status === 'cancelled') setPhase('cancelled')
        else setPhase('accepted') // already past this stage somehow — don't get stuck
      })
      .catch(() => { if (!cancelled) setPhase('error') })
    return () => { cancelled = true }
  }, [bookingId])

  // Realtime subscription — fires the moment the operator accepts/rejects,
  // without the customer needing to refresh or poll.
  useEffect(() => {
    if (!bookingId) return
    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` },
        (payload) => {
          const updated = payload.new as Booking
          setBooking(updated)
          if (updated.status === 'accepted') setPhase('accepted')
          else if (updated.status === 'rejected') setPhase('rejected')
          else if (updated.status === 'cancelled') setPhase('cancelled')
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [bookingId])

  // Once accepted, hand off to payment — runs once via settledRef so a
  // re-render from a second realtime payload doesn't navigate twice.
  useEffect(() => {
    if (phase !== 'accepted' || !booking || settledRef.current) return
    settledRef.current = true
    setPendingBooking({
      booking,
      code: booking.booking_code || pendingBookingCode || '',
      date: booking.date || pendingBookingDate || '',
    })
    const id = setTimeout(() => navigate('/mpesa/booking'), 900)
    return () => clearTimeout(id)
  }, [phase, booking, navigate, setPendingBooking, pendingBookingCode, pendingBookingDate])

  async function handleCancel() {
    if (!booking || cancelling) return
    setCancelling(true)
    try {
      const base = import.meta.env.VITE_SPLASHMAIN_URL || 'https://splashmain.vercel.app'
      const res = await fetch(`${base}/api/booking-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, email: booking.user_email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not cancel. Try again.')
      setPhase('cancelled')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not cancel. Try again.', true)
    } finally {
      setCancelling(false)
    }
  }

  // ── Render ──────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white">
        <div className="sp-skeleton h-8 w-8 rounded-full" />
      </div>
    )
  }

  if (phase === 'not_found' || phase === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white px-6 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <div className="text-[15px] font-bold text-ink mb-1">
          {phase === 'not_found' ? 'Booking not found' : 'Something went wrong'}
        </div>
        <div className="text-[13px] text-muted mb-4">Please try booking again.</div>
        <button onClick={() => navigate('/discover')}
          className="sp-press rounded-[11px] px-4 py-2.5 text-[13px] font-bold text-white"
          style={{ background: '#0A84FF' }}>
          Back to Discover
        </button>
      </div>
    )
  }

  if (phase === 'accepted') {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white px-6 text-center">
        <div className="text-5xl mb-4">✅</div>
        <div className="text-[18px] font-extrabold text-ink mb-1">Request accepted!</div>
        <div className="text-[13px] text-muted">Taking you to payment…</div>
      </div>
    )
  }

  if (phase === 'rejected') {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white px-6 text-center">
        <div className="text-5xl mb-4">😕</div>
        <div className="text-[18px] font-extrabold text-ink mb-1">Request declined</div>
        <div className="text-[13px] text-muted mb-1">
          {booking?.location} couldn't take your booking{booking?.rejection_reason ? `: ${booking.rejection_reason}` : ' right now.'}
        </div>
        <div className="text-[13px] text-muted mb-6">No charge was made — try another wash point.</div>
        <button onClick={() => navigate('/discover')}
          className="sp-press w-full max-w-[260px] rounded-[14px] py-3.5 text-[14px] font-bold text-white"
          style={{ background: '#0A84FF' }}>
          Book Elsewhere
        </button>
      </div>
    )
  }

  if (phase === 'cancelled') {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white px-6 text-center">
        <div className="text-5xl mb-4">🚫</div>
        <div className="text-[18px] font-extrabold text-ink mb-1">Booking cancelled</div>
        <div className="text-[13px] text-muted mb-6">No charge was made.</div>
        <button onClick={() => navigate('/discover')}
          className="sp-press w-full max-w-[260px] rounded-[14px] py-3.5 text-[14px] font-bold text-white"
          style={{ background: '#0A84FF' }}>
          Find Another Wash
        </button>
      </div>
    )
  }

  // phase === 'pending'
  return (
    <div className="flex h-full flex-col items-center justify-center bg-white px-6 text-center">
      <div className="relative mb-6 h-16 w-16">
        <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(10,132,255,0.12)' }} />
        <div
          className="absolute inset-0 rounded-full border-[3px] border-transparent"
          style={{ borderTopColor: '#0A84FF', animation: 'sp-spin 0.9s linear infinite' }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">⏳</div>
      </div>

      <div className="text-[18px] font-extrabold text-ink mb-1.5">Waiting for operator…</div>
      <div className="text-[13px] text-muted mb-1 max-w-[280px]">
        {booking?.location} needs to confirm before you pay.
      </div>
      {pendingBookingCode && (
        <div className="text-[11px] text-muted mb-6">Request #{booking?.booking_code}</div>
      )}

      <button
        onClick={handleCancel}
        disabled={cancelling}
        className="sp-press w-full max-w-[260px] rounded-[14px] py-3.5 text-[14px] font-bold disabled:opacity-50"
        style={{ background: '#F5F5F7', color: '#FF3B30', border: '1px solid #EBEBED' }}
      >
        {cancelling ? 'Cancelling…' : 'Cancel Request'}
      </button>

      <style>{`@keyframes sp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
