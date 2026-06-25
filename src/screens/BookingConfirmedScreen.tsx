import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { sendBookingSms } from '../lib/mpesa'

export function BookingConfirmedScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const pendingBooking = useAppStore((s) => s.pendingBooking)
  const [smsNote, setSmsNote] = useState('📱 Sending confirmation SMS...')

  useEffect(() => {
    if (!pendingBooking) { navigate('/home', { replace: true }); return }
    if (!currentUser?.phone) { setSmsNote('No phone number on file'); return }
    sendBookingSms(currentUser.phone, pendingBooking.booking.location, pendingBooking.date, pendingBooking.booking.time)
      .then((success) => {
        setSmsNote(success ? `SMS sent to ${currentUser.phone}` : 'Booking saved. SMS unavailable.')
      })
      .catch(() => setSmsNote('Booking saved. SMS unavailable.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!pendingBooking) return null
  const { booking, date } = pendingBooking
  const carInfo = `${booking.car_make ?? ''} ${booking.car_model ?? ''}`.trim()

  return (
    <div className="flex h-full flex-col items-center bg-white overflow-y-auto px-5 py-8">
      {/* Success mark */}
      <div className="relative mb-5 mt-2 flex-shrink-0">
        <div
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-[32px]"
          style={{
            background: '#E8F9ED',
            border: '3px solid #30D158',
            boxShadow: '0 0 0 10px rgba(48,209,88,0.1)',
          }}
        >
          ✓
        </div>
      </div>

      <div className="text-[24px] font-extrabold text-ink text-center mb-1.5"
        style={{ letterSpacing: '-0.5px' }}>
        Booking Confirmed!
      </div>
      <div className="text-[14px] text-muted text-center mb-6">See you at the wash point.</div>

      {/* Booking details card */}
      <div className="w-full rounded-[20px] bg-white p-5 mb-3"
        style={{ border: '1px solid #EBEBED', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-4">
          Booking Details
        </div>
        {[
          { icon: '📍', label: 'Location', value: booking.location },
          { icon: '🚗', label: 'Car', value: `${carInfo || '—'} · ${booking.car_plate || '—'}` },
          { icon: '✨', label: 'Service', value: booking.service_name || '—' },
          { icon: '📅', label: 'Date', value: date },
          { icon: '🕐', label: 'Time', value: booking.time },
          { icon: '💳', label: 'Amount', value: `KSh ${booking.total_amount?.toLocaleString() ?? '—'}`, accent: true },
        ].map(({ icon, label, value, accent }, i) => (
          <div key={label} className="flex items-center gap-3 py-2.5"
            style={{ borderBottom: i < 5 ? '1px solid #EBEBED' : 'none' }}>
            <span className="text-[16px] w-6 flex-shrink-0 text-center">{icon}</span>
            <div className="flex-1">
              <div className="text-[10px] text-muted mb-0.5">{label}</div>
              <div className="text-[13px] font-semibold" style={{ color: accent ? '#0A84FF' : '#0D0D0D' }}>
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SMS status */}
      <div className="w-full flex items-center gap-3 rounded-[14px] p-3.5 mb-5"
        style={{ background: '#E0FAF9' }}>
        <span className="text-base flex-shrink-0">📱</span>
        <span className="text-[13px] font-medium" style={{ color: '#0A2820' }}>{smsNote}</span>
      </div>

      {/* Actions */}
      <button
        onClick={() => navigate('/qr')}
        className="sp-press w-full rounded-[16px] py-4 text-[15px] font-extrabold text-white mb-3"
        style={{ background: '#0A84FF', boxShadow: '0 8px 24px rgba(10,132,255,0.32)' }}>
        View Wash Pass (QR) →
      </button>
      <button
        onClick={() => navigate('/home')}
        className="sp-press w-full rounded-[16px] py-4 text-[15px] font-bold text-ink"
        style={{ background: '#F5F5F7', border: '1px solid #EBEBED' }}>
        Back to Home
      </button>
    </div>
  )
}
