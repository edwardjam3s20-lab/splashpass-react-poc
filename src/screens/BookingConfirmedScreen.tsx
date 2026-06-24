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
    if (!pendingBooking) {
      navigate('/home', { replace: true })
      return
    }
    if (!currentUser?.phone) {
      setSmsNote('No phone number on file')
      return
    }
    sendBookingSms(currentUser.phone, pendingBooking.booking.location, pendingBooking.date, pendingBooking.booking.time)
      .then((success) => {
        setSmsNote(
          success ? `Confirmation SMS sent to ${currentUser.phone}` : 'Booking saved. SMS unavailable.'
        )
      })
      .catch(() => setSmsNote('Booking saved. SMS unavailable.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on mount
  }, [])

  if (!pendingBooking) return null
  const { booking, date } = pendingBooking
  const carInfo = `${booking.car_make ?? ''} ${booking.car_model ?? ''}`.trim()

  return (
    <div className="flex h-full flex-col items-center justify-center overflow-y-auto bg-bg px-6 py-9 text-center">
      <div className="mb-3 text-[56px]">✅</div>
      <h2 className="mb-2 text-[26px] font-extrabold text-navy">Booking Confirmed!</h2>
      <p className="mb-6 text-sm text-muted">You're all set. See you at the wash.</p>

      <div className="mb-5.5 w-full max-w-sm rounded-2xl bg-white p-4.5 text-left shadow-app">
        <Row label="Location" value={booking.location} />
        <Row label="Car" value={`${carInfo || '—'} · ${booking.car_plate || '—'}`} />
        <Row label="Service" value={booking.service_name || '—'} />
        <Row label="Date" value={date} />
        <Row label="Time" value={booking.time} />
        <Row label="Amount paid" value={`KSh ${booking.total_amount?.toLocaleString() ?? '—'}`} accent />
      </div>

      <div className="mb-5.5 text-[13px] text-muted">{smsNote}</div>

      <button
        type="button"
        onClick={() => navigate('/qr')}
        className="mb-3 w-full max-w-sm rounded-2xl bg-accent py-3.5 text-sm font-bold text-white shadow-app-md"
      >
        View Wash Pass (QR)
      </button>
      <button
        type="button"
        onClick={() => navigate('/home')}
        className="w-full max-w-sm rounded-2xl border-[1.5px] border-slate-200 bg-white py-3.5 text-sm font-bold text-navy"
      >
        Back to Home
      </button>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <strong className={accent ? 'text-accent' : 'text-navy'}>{value}</strong>
    </div>
  )
}
