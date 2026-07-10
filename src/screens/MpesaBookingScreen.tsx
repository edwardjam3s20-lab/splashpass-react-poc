import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { triggerStkPush } from '../lib/mpesa'
import { fetchWalletStatus, payBookingFromWallet } from '../lib/wallet'
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
  const [method, setMethod] = useState<'mpesa' | 'wallet'>('mpesa')
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [walletPaying, setWalletPaying] = useState(false)

  useEffect(() => {
    fetchWalletStatus().then((s) => { if (s) setWalletBalance(s.balance) })
  }, [])

  const { isPaid, timedOut } = useBookingPaymentPoll(pendingBooking?.booking.id, pollEnabled)

  useEffect(() => {
    if (!pendingBooking) navigate('/home', { replace: true })
  }, [pendingBooking, navigate])

  useEffect(() => {
    if (isPaid && pendingBooking) {
      setPollEnabled(false); setManualConfirmAvailable(false)
      setStatus('success'); setStatusText('Payment confirmed!')
      showToast('Payment confirmed!')
      const id = setTimeout(() => navigate('/confirmed'), 1200)
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
  // total_amount is missing in a real case (see PendingApprovalScreen's
  // realtime handler — worth checking why upstream). Every other screen in
  // this app already guards this same field with ?? for display; this one
  // didn't, which crashed the whole screen. But display isn't the only risk
  // here — 0 is a safe fallback to *show*, it is not a safe amount to
  // *charge*. amountKnown gates both payment buttons below so a missing
  // amount blocks payment instead of silently charging KSh 0.
  const amountKnown = booking.total_amount != null
  const amount = booking.total_amount ?? 0

  async function handlePay() {
    if (!amountKnown) { setStatus('error'); setStatusText("Couldn't load the amount due — please go back and retry."); return }
    if (!phone.trim()) { setStatus('error'); setStatusText('Please enter your M-Pesa number.'); return }
    setPaying(true); setStatus('pending'); setStatusText('Sending M-Pesa prompt...')
    try {
      const result = await triggerStkPush(phone.trim(), booking.total_amount!)
      if (result.success) {
        setStatusText('Enter your M-Pesa PIN on your phone.')
        showToast('M-Pesa prompt sent!')
        setManualConfirmAvailable(true); setPollEnabled(true)
      } else {
        setStatus('error'); setStatusText(result.message || 'Payment failed. Try again.')
      }
    } catch (e) {
      setStatus('error'); setStatusText(e instanceof Error ? `Error: ${e.message}` : 'Something went wrong.')
    } finally { setPaying(false) }
  }

  async function handleWalletPay() {
    if (!amountKnown) { showToast("Couldn't load the amount due — please go back and retry.", true); return }
    setWalletPaying(true)
    try {
      const result = await payBookingFromWallet(booking.id, booking.total_amount!)
      if (!result.ok) {
        showToast(result.error || 'Wallet payment failed', true)
        return
      }
      setWalletBalance(result.balance ?? null)
      setStatus('success'); setStatusText('Payment confirmed!')
      showToast('Paid from wallet!')
      setTimeout(() => navigate('/confirmed'), 1000)
    } finally {
      setWalletPaying(false)
    }
  }

  function handleManualConfirm() {
    setPollEnabled(false); setManualConfirmAvailable(false)
    setStatus('success'); setStatusText('Payment confirmed!')
    setTimeout(() => navigate('/confirmed'), 800)
  }

  function handleBack() {
    setPollEnabled(false); setPendingBooking(null); navigate(-1)
  }

  const statusBg: Record<StatusKind, string> = {
    idle: 'transparent', pending: '#E0FAF9', success: '#E8F9ED', error: '#FFF0EE',
  }
  const statusTextColor: Record<StatusKind, string> = {
    idle: '', pending: '#0A2820', success: '#0A3A10', error: '#CC2222',
  }

  return (
    <div className="flex h-full flex-col" style={{ background: '#F5F5F7' }}>
      {/* Header */}
      <div className="flex items-center gap-3 bg-white px-4 py-4" style={{ boxShadow: '0 1px 0 #EBEBED' }}>
        <button onClick={handleBack}
          className="sp-press flex h-9 w-9 items-center justify-center rounded-[11px] text-lg text-ink"
          style={{ background: '#F5F5F7' }}>
          ←
        </button>
        <div>
          <div className="text-[16px] font-extrabold text-ink" style={{ letterSpacing: '-0.3px' }}>Pay for Wash</div>
          <div className="text-[12px] text-muted">{booking.location} · {booking.service_name}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-5">
        {/* Amount card */}
        <div className="rounded-[20px] px-6 py-8 text-center mb-5"
          style={{ background: 'linear-gradient(135deg, #1C2E4A, #0A1628)', boxShadow: '0 12px 40px rgba(10,22,40,0.25)' }}>
          <div className="text-[13px] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Amount Due
          </div>
          <div className="text-[42px] font-extrabold text-white leading-none mb-1"
            style={{ letterSpacing: '-1.5px' }}>
            {amountKnown ? `KSh ${amount.toLocaleString()}` : 'Amount unavailable'}
          </div>
          <div className="text-[13px] mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
            via M-Pesa
          </div>
        </div>

        {/* Payment method toggle */}
        <div className="flex rounded-[14px] p-1 mb-4" style={{ background: '#EBEBED' }}>
          {(['mpesa', 'wallet'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className="flex-1 rounded-[11px] py-2.5 text-[13px] font-bold transition-colors duration-150"
              style={{
                background: method === m ? '#fff' : 'transparent',
                color: method === m ? '#0D0D0D' : '#6E6E73',
                boxShadow: method === m ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {m === 'mpesa' ? '📱 M-Pesa' : `👛 Wallet`}
            </button>
          ))}
        </div>

        {method === 'wallet' ? (
          <>
            <div className="rounded-[16px] bg-white p-4 mb-4" style={{ border: '1px solid #EBEBED' }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted">Wallet Balance</span>
                <span className="text-[16px] font-extrabold text-ink">
                  {walletBalance == null ? '···' : `KSh ${walletBalance.toLocaleString()}`}
                </span>
              </div>
              {walletBalance != null && walletBalance < amount && (
                <div className="mt-2.5 rounded-[10px] px-3 py-2 text-[12px]" style={{ background: '#FFF0EE', color: '#CC2222' }}>
                  Not enough balance. Top up KSh {(amount - walletBalance).toLocaleString()} more, or pay via M-Pesa.
                </div>
              )}
            </div>

            <button
              onClick={handleWalletPay}
              disabled={walletPaying || status === 'success' || !amountKnown || walletBalance == null || walletBalance < amount}
              className="sp-press w-full rounded-[16px] py-4 mb-3 text-[15px] font-extrabold text-white"
              style={{
                background: '#0A84FF',
                boxShadow: '0 8px 24px rgba(10,132,255,0.36)',
                opacity: walletPaying || status === 'success' || !amountKnown || walletBalance == null || walletBalance < amount ? 0.5 : 1,
              }}
            >
              {walletPaying ? 'Processing…' : `Pay KSh ${amount.toLocaleString()} from Wallet`}
            </button>
            {walletBalance != null && walletBalance < amount && (
              <button
                onClick={() => navigate('/wallet')}
                className="sp-press w-full rounded-[16px] py-3.5 mb-3 text-[14px] font-bold"
                style={{ border: '1.5px solid #0A84FF', color: '#0A84FF', background: 'rgba(10,132,255,0.06)' }}
              >
                Top Up Wallet
              </button>
            )}
          </>
        ) : (
          <>
            {/* Phone input */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-2">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                placeholder="0712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-[14px] px-4 py-3.5 text-[15px] font-semibold text-ink bg-white outline-none"
                style={{ border: '1.5px solid #EBEBED' }}
              />
            </div>

            {/* Status message */}
            {status !== 'idle' && (
              <div className="rounded-[14px] px-4 py-3 mb-4 text-[14px] font-medium flex items-center gap-2"
                style={{ background: statusBg[status], color: statusTextColor[status] }}>
                {status === 'pending' && <span>⏳</span>}
                {status === 'success' && <span>✅</span>}
                {status === 'error' && <span>⚠️</span>}
                {statusText}
              </div>
            )}

            {manualConfirmAvailable && (
              <button onClick={handleManualConfirm}
                className="sp-press w-full rounded-[14px] py-3.5 mb-3 text-[14px] font-bold"
                style={{ border: '1.5px solid #0A84FF', color: '#0A84FF', background: 'rgba(10,132,255,0.06)' }}>
                ✓ I've paid — get my wash pass
              </button>
            )}

            <button
              onClick={handlePay}
              disabled={paying || status === 'success' || !amountKnown}
              className="sp-press w-full rounded-[16px] py-4 mb-3 text-[15px] font-extrabold text-white"
              style={{
                background: '#0A84FF',
                boxShadow: '0 8px 24px rgba(10,132,235,0.36)',
                opacity: paying || status === 'success' || !amountKnown ? 0.5 : 1,
              }}>
              {paying ? 'Please wait…' : 'Pay Now'}
            </button>
          </>
        )}

        <button onClick={handleBack}
          className="sp-press w-full rounded-[16px] py-4 text-[15px] font-bold text-ink"
          style={{ background: '#F5F5F7', border: '1px solid #EBEBED' }}>
          Back to Booking
        </button>
      </div>
    </div>
  )
}
