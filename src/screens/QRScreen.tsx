import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useAppStore } from '../store/useAppStore'
import { getBookingById } from '../lib/bookings'
import type { Booking } from '../types/database'

export function QRScreen() {
  const navigate = useNavigate()
  const { bookingId } = useParams<{ bookingId?: string }>()
  const currentUser = useAppStore((s) => s.currentUser)
  const pendingBooking = useAppStore((s) => s.pendingBooking)
  const resetBookingFlow = useAppStore((s) => s.resetBookingFlow)

  // When revisiting via /qr/:bookingId, fetch that booking fresh from the
  // database — it's already persisted there (booking_code included), so it
  // survives navigation/refresh even though pendingBooking does not.
  const [fetchedBooking, setFetchedBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(!!bookingId)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!bookingId) return
    let cancelled = false
    getBookingById(bookingId)
      .then((b) => {
        if (cancelled) return
        if (!b) setNotFound(true)
        else setFetchedBooking(b)
      })
      .catch(() => { if (!cancelled) setNotFound(true) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [bookingId])

  // Resolve to a single shape regardless of source
  const booking = bookingId ? fetchedBooking : pendingBooking?.booking ?? null
  const code = bookingId ? fetchedBooking?.booking_code : pendingBooking?.code
  const date = bookingId ? fetchedBooking?.date : pendingBooking?.date

  useEffect(() => {
    if (isLoading) return
    if (!currentUser) { navigate('/home', { replace: true }); return }
    if (!booking) { navigate(bookingId ? '/bookings' : '/home', { replace: true }) }
  }, [isLoading, currentUser, booking, bookingId, navigate])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="sp-skeleton h-8 w-8 rounded-full" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white px-5 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <div className="text-[15px] font-bold text-ink mb-1">Booking not found</div>
        <div className="text-[13px] text-muted mb-4">This booking may have been removed.</div>
        <button onClick={() => navigate('/bookings')}
          className="sp-press rounded-[11px] px-4 py-2.5 text-[13px] font-bold text-white"
          style={{ background: '#0A84FF' }}>
          Back to Bookings
        </button>
      </div>
    )
  }

  if (!booking || !currentUser || !code) return null

  const carInfo = `${booking.car_make ?? ''} ${booking.car_model ?? ''}`.trim()
  // The operator's scanner only ever reads `id` (looks the booking up fresh
  // server-side from there) — encoding name/location/date too just bloats
  // the payload, forcing a denser QR matrix that's markedly harder for a
  // phone camera to resolve at small print/screen sizes. Keep it minimal.
  const qrData = JSON.stringify({ id: booking.id })

  function handleDone() {
    resetBookingFlow()
    navigate('/bookings')
  }

  return (
    <div className="flex h-full flex-col items-center bg-white overflow-y-auto px-5 pt-6 pb-8">
      {bookingId && (
        <button
          onClick={() => navigate('/bookings')}
          className="sp-press self-start flex h-9 w-9 items-center justify-center rounded-[11px] text-lg text-ink mb-3"
          style={{ background: '#F5F5F7' }}
        >
          ←
        </button>
      )}

      <div className="text-[22px] font-extrabold text-ink mb-1 text-center" style={{ letterSpacing: '-0.5px' }}>
        Your Wash Pass
      </div>
      <div className="text-[13px] text-muted text-center mb-6">
        Show this to the wash attendant
      </div>

      {/* QR Card */}
      <div className="w-full max-w-[280px] rounded-[24px] bg-white p-6 mb-5 text-center"
        style={{
          border: '1px solid #EBEBED',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        }}>
        {/* Logo strip */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] text-base"
            style={{ background: 'linear-gradient(135deg, #00C6BE, #0A84FF)' }}>
            💧
          </div>
          <span className="text-[14px] font-extrabold text-ink" style={{ letterSpacing: '-0.3px' }}>SplashPass</span>
        </div>

        <div className="flex justify-center mb-4">
          <div className="rounded-[16px] p-3" style={{ background: '#F5F5F7' }}>
            <QRCodeSVG value={qrData} size={200} level="H" fgColor="#0A1628" bgColor="transparent" />
          </div>
        </div>

        <div className="text-[22px] font-extrabold text-ink tracking-[3px] mb-1">{code}</div>
        <div className="text-[11px] text-muted">Booking Code</div>
      </div>

      {/* Details card */}
      <div className="w-full rounded-[18px] bg-white p-4 mb-5"
        style={{ border: '1px solid #EBEBED', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        {[
          { icon: '📍', label: 'Location', value: booking.location },
          { icon: '🚗', label: 'Car', value: `${carInfo || '—'} · ${booking.car_plate || '—'}` },
          { icon: '✨', label: 'Service', value: booking.service_name || '—' },
          { icon: '📅', label: 'Date & Time', value: `${date} · ${booking.time}` },
          { icon: '💳', label: 'Total Paid', value: `KSh ${booking.total_amount?.toLocaleString() ?? '—'}`, accent: true },
        ].map(({ icon, label, value, accent }, i) => (
          <div key={label} className="flex items-center gap-2.5 py-2.5"
            style={{ borderBottom: i < 4 ? '1px solid #EBEBED' : 'none' }}>
            <span className="text-[15px] w-5 flex-shrink-0 text-center">{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-muted">{label}</div>
              <div className="text-[13px] font-semibold truncate" style={{ color: accent ? '#0A84FF' : '#0D0D0D' }}>
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!bookingId && (
        <button onClick={handleDone}
          className="sp-press w-full rounded-[16px] py-4 text-[15px] font-bold text-ink"
          style={{ background: '#F5F5F7', border: '1px solid #EBEBED' }}>
          Done — Back to Bookings
        </button>
      )}
    </div>
  )
}
