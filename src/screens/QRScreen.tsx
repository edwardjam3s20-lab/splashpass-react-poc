import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useAppStore } from '../store/useAppStore'

export function QRScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const pendingBooking = useAppStore((s) => s.pendingBooking)
  const resetBookingFlow = useAppStore((s) => s.resetBookingFlow)

  useEffect(() => {
    if (!pendingBooking || !currentUser) {
      navigate('/home', { replace: true })
    }
  }, [pendingBooking, currentUser, navigate])

  if (!pendingBooking || !currentUser) return null

  const { booking, code, date } = pendingBooking
  const carInfo = `${booking.car_make ?? ''} ${booking.car_model ?? ''}`.trim()
  const qrData = JSON.stringify({
    id: booking.id,
    user: currentUser.name,
    point: booking.location,
    date,
    time: booking.time,
    code,
  })

  function handleDone() {
    resetBookingFlow()
    navigate('/home')
  }

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto bg-bg px-6 py-10 text-center">
      <h2 className="mb-1.5 text-2xl font-extrabold text-navy">Your Wash Code</h2>
      <p className="mb-7 text-sm text-muted">Show this QR code at the wash point</p>

      <div className="mb-5 rounded-[22px] bg-white p-5 shadow-app-lg">
        <QRCodeSVG value={qrData} size={200} fgColor="#0B1437" bgColor="#ffffff" />
      </div>

      <div className="mb-6 font-display text-xl font-extrabold tracking-wide text-navy">
        {code}
      </div>

      <div className="mb-7 w-full max-w-sm rounded-2xl bg-white p-4.5 text-left shadow-app">
        <InfoRow label="Location" value={booking.location} />
        <InfoRow label="Car" value={`${carInfo || '—'} · ${booking.car_plate || '—'}`} />
        <InfoRow label="Service" value={booking.service_name || '—'} />
        <InfoRow label="Date" value={booking.date} />
        <InfoRow label="Time" value={booking.time} />
        <InfoRow
          label="Total paid"
          value={`KSh ${booking.total_amount?.toLocaleString() ?? '—'}`}
          accent
        />
      </div>

      <button
        type="button"
        onClick={handleDone}
        className="w-full max-w-sm rounded-2xl border-[1.5px] border-slate-200 bg-white py-3.5 text-sm font-bold text-navy"
      >
        Back to Home
      </button>
    </div>
  )
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <strong className={accent ? 'text-accent' : 'text-navy'}>{value}</strong>
    </div>
  )
}
