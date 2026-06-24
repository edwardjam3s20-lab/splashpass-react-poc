import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { triggerStkPush } from '../lib/mpesa'
import { useBookingPaymentPoll } from '../hooks/useBookingPaymentPoll'

type StatusKind = 'idle' | 'pending' | 'success' | 'error'

export function MpesaBookingScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const pendingBooking = useAppStore((s) => s.pendingBooking)
  const setPendingBooking = useAppStore((s) => s.setPendingBooking)
  const showToast = useAppStore((s) => s.showToast)

  const [phone, setPhone] = useState(currentUser?.phone ?? '')
  const [status, setStatus] = useState<StatusKind>('idle')
  const [statusText, setStatusText] = useState('')
  const [paying, setPaying] = useState(false)
  const [pollEnabled, setPollEnabled] = useState(false)
  const [manualConfirmAvailable, setManualConfirmAvailable] = useState(false)

  const { isPaid, timedOut } = useBookingPaymentPoll(pendingBooking?.booking.id, pollEnabled)

  // Redirect away if there's no pending booking (e.g. direct nav / refresh)
  useEffect(() => {
    if (!pendingBooking) navigate('/home', { replace: true })
  }, [pendingBooking, navigate])

  // React to poll result, mirrors the original's interval callback body
  useEffect(() => {
    if (isPaid && pendingBooking) {
      setPollEnabled(false)
      setManualConfirmAvailable(false)
      setStatus('success')
      setStatusText('Payment confirmed!')
      showToast('Payment confirmed!')
      const id = setTimeout(() => {
        navigate('/confirmed')
      }, 1200)
      return () => clearTimeout(id)
    }
  }, [isPaid, pendingBooking, navigate])

  useEffect(() => {
    if (timedOut && pollEnabled) {
      setPollEnabled(false)
      setStatusText('Payment pending. Check your M-Pesa messages.')
    }
  }, [timedOut, pollEnabled])

  if (!pendingBooking) return null

  const { booking } = pendingBooking

  async function handlePay() {
    if (!phone.trim()) {
      setStatus('error')
      setStatusText('Please enter your M-Pesa number.')
      return
    }

    setPaying(true)
    setStatus('pending')
    setStatusText('Sending M-Pesa prompt...')
    try {
      const result = await triggerStkPush(phone.trim(), booking.total_amount)
      if (result.success) {
        setStatusText('Enter your M-Pesa PIN on your phone.')
        showToast('M-Pesa prompt sent!')
        setManualConfirmAvailable(true)
        setPollEnabled(true)
      } else {
        setStatus('error')
        setStatusText(result.message || 'Payment failed. Try again.')
      }
    } catch (e) {
      setStatus('error')
      setStatusText(e instanceof Error ? `Error: ${e.message}` : 'Something went wrong.')
    } finally {
      setPaying(false)
    }
  }

  function handleManualConfirm() {
    setPollEnabled(false)
    setManualConfirmAvailable(false)
    setStatus('success')
    setStatusText('Payment confirmed!')
    setTimeout(() => {
      navigate('/confirmed')
    }, 800)
  }

  function handleBack() {
    setPollEnabled(false)
    setPendingBooking(null)
    navigate(-1)
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-bg">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-surface-1 px-4 py-4">
        <button
          onClick={handleBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-navy hover:bg-bg"
        >
          ←
        </button>
        <h2 className="text-base font-bold text-navy">Pay for Wash</h2>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="mb-6 rounded-2xl bg-navy px-6 py-7 text-center">
          <div className="font-display text-[34px] font-extrabold text-white">
            KSh {booking.total_amount.toLocaleString()}
          </div>
          <div className="mt-1 text-sm text-white/70">
            {booking.location} · {booking.service_name}
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-semibold text-navy">
            M-Pesa Phone Number
          </label>
          <input
            type="tel"
            placeholder="0712 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3.5 text-sm text-navy outline-none focus:border-accent"
          />
        </div>

        {status !== 'idle' && (
          <div
            className={[
              'mb-4 rounded-2xl px-4 py-3 text-sm font-medium',
              status === 'error' && 'bg-red-50 text-danger',
              status === 'pending' && 'bg-blue-50 text-accent',
              status === 'success' && 'bg-green-50 text-success',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {statusText}
          </div>
        )}

        {manualConfirmAvailable && (
          <button
            type="button"
            onClick={handleManualConfirm}
            className="mb-3 w-full rounded-2xl border-[1.5px] border-accent/40 py-3 text-[13px] font-semibold text-accent"
          >
            ✓ I've paid — get my wash pass
          </button>
        )}

        <button
          type="button"
          disabled={paying}
          onClick={handlePay}
          className="mb-3 w-full rounded-2xl bg-accent py-4 text-[15px] font-bold text-white shadow-app-md disabled:opacity-50 active:scale-[0.98]"
        >
          {paying ? 'Please wait…' : 'Pay Now'}
        </button>
        <button
          type="button"
          onClick={handleBack}
          className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white py-4 text-[15px] font-bold text-navy"
        >
          Back to Booking
        </button>
      </div>
    </div>
  )
}
