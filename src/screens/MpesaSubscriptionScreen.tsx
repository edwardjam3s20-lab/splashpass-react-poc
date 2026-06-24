import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { triggerStkPush } from '../lib/mpesa'
import { useSubscriptionPoll } from '../hooks/useSubscriptionPoll'

type StatusKind = 'idle' | 'pending' | 'success' | 'error'

export function MpesaSubscriptionScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)
  const selectedSubPlan = useAppStore((s) => s.selectedSubPlan)
  const setSelectedSubPlan = useAppStore((s) => s.setSelectedSubPlan)
  const showToast = useAppStore((s) => s.showToast)

  const [phone, setPhone] = useState(currentUser?.phone ?? '')
  const [status, setStatus] = useState<StatusKind>('idle')
  const [statusText, setStatusText] = useState('')
  const [paying, setPaying] = useState(false)
  const [pollEnabled, setPollEnabled] = useState(false)

  const { isActive, activatedProfile, timedOut } = useSubscriptionPoll(currentUser?.email, pollEnabled)

  useEffect(() => {
    if (!selectedSubPlan) navigate('/plans', { replace: true })
  }, [selectedSubPlan, navigate])

  useEffect(() => {
    if (isActive && activatedProfile) {
      setPollEnabled(false)
      setCurrentUser(activatedProfile)
      setStatus('success')
      setStatusText('Subscription activated!')
      showToast('Subscription activated! 🎉')
      const id = setTimeout(() => {
        setSelectedSubPlan(null)
        navigate('/home')
      }, 2000)
      return () => clearTimeout(id)
    }
  }, [isActive, activatedProfile, setCurrentUser, setSelectedSubPlan, navigate, showToast])

  useEffect(() => {
    if (timedOut && pollEnabled) {
      setPollEnabled(false)
      setStatusText('Payment pending. Dashboard updates once confirmed.')
    }
  }, [timedOut, pollEnabled])

  if (!selectedSubPlan) return null

  async function handlePay() {
    if (!selectedSubPlan) return
    if (!phone.trim()) {
      setStatus('error')
      setStatusText('Please enter your M-Pesa number.')
      return
    }

    setPaying(true)
    setStatus('pending')
    setStatusText('Sending M-Pesa prompt...')
    try {
      const result = await triggerStkPush(phone.trim(), selectedSubPlan.price)
      if (result.success) {
        setStatusText('Enter your M-Pesa PIN on your phone.')
        showToast('M-Pesa prompt sent!')
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

  function handleBack() {
    setPollEnabled(false)
    setSelectedSubPlan(null)
    navigate('/plans')
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
        <h2 className="text-base font-bold text-navy">Subscribe · {selectedSubPlan.name}</h2>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="mb-6 rounded-2xl bg-navy px-6 py-7 text-center">
          <div className="font-display text-[34px] font-extrabold text-white">
            KSh {selectedSubPlan.price}
          </div>
          <div className="mt-1 text-sm text-white/70">
            {selectedSubPlan.name} · {selectedSubPlan.car_limit} car
            {selectedSubPlan.car_limit > 1 ? 's' : ''} · Auto-renews {selectedSubPlan.billing}ly
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
          Back to Plans
        </button>
      </div>
    </div>
  )
}
