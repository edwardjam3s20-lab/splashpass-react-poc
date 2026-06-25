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
      setPollEnabled(false); setCurrentUser(activatedProfile)
      setStatus('success'); setStatusText('Subscription activated!')
      showToast('Subscription activated! 🎉')
      const id = setTimeout(() => { setSelectedSubPlan(null); navigate('/home') }, 2000)
      return () => clearTimeout(id)
    }
  }, [isActive, activatedProfile])

  useEffect(() => {
    if (timedOut && pollEnabled) {
      setPollEnabled(false); setStatusText('Payment pending. Check your M-Pesa.')
    }
  }, [timedOut, pollEnabled])

  if (!selectedSubPlan) return null

  async function handlePay() {
    if (!phone.trim()) { setStatus('error'); setStatusText('Please enter your M-Pesa number.'); return }
    setPaying(true); setStatus('pending'); setStatusText('Sending M-Pesa prompt…')
    try {
      const result = await triggerStkPush(phone.trim(), selectedSubPlan!.price)
      if (result.success) {
        setStatusText('Enter your M-Pesa PIN on your phone.'); showToast('M-Pesa prompt sent!'); setPollEnabled(true)
      } else { setStatus('error'); setStatusText(result.message || 'Payment failed.') }
    } catch (e) {
      setStatus('error'); setStatusText(e instanceof Error ? e.message : 'Something went wrong.')
    } finally { setPaying(false) }
  }

  function handleBack() { setPollEnabled(false); setSelectedSubPlan(null); navigate('/plans') }

  const statusBg: Record<StatusKind, string> = { idle: 'transparent', pending: '#E0FAF9', success: '#E8F9ED', error: '#FFF0EE' }
  const statusCol: Record<StatusKind, string> = { idle: '', pending: '#0A2820', success: '#0A3A10', error: '#CC2222' }

  return (
    <div className="flex h-full flex-col" style={{ background: '#F5F5F7' }}>
      <div className="flex items-center gap-3 bg-white px-4 py-4" style={{ boxShadow: '0 1px 0 #EBEBED' }}>
        <button onClick={handleBack} className="sp-press flex h-9 w-9 items-center justify-center rounded-[11px] text-lg text-ink" style={{ background: '#F5F5F7' }}>←</button>
        <div>
          <div className="text-[16px] font-extrabold text-ink" style={{ letterSpacing: '-0.3px' }}>Subscribe</div>
          <div className="text-[12px] text-muted">{selectedSubPlan.name} Plan · {selectedSubPlan.car_limit} car{selectedSubPlan.car_limit > 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-5">
        {/* Amount */}
        <div className="rounded-[20px] px-6 py-8 text-center mb-5"
          style={{ background: 'linear-gradient(135deg, #1C2E4A, #0A1628)', boxShadow: '0 12px 40px rgba(10,22,40,0.25)' }}>
          <div className="text-[13px] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{selectedSubPlan.name} Plan</div>
          <div className="text-[44px] font-extrabold text-white leading-none mb-1.5" style={{ letterSpacing: '-1.5px' }}>
            KSh {selectedSubPlan.price}
          </div>
          <div className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            per {selectedSubPlan.billing} · auto-renews via M-Pesa
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-2">M-Pesa Phone Number</label>
          <input type="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-[14px] px-4 py-3.5 text-[15px] font-semibold text-ink bg-white outline-none"
            style={{ border: '1.5px solid #EBEBED' }} />
        </div>

        {status !== 'idle' && (
          <div className="rounded-[14px] px-4 py-3 mb-4 text-[14px] font-medium flex items-center gap-2"
            style={{ background: statusBg[status], color: statusCol[status] }}>
            {status === 'pending' && <span>⏳</span>}{status === 'success' && <span>✅</span>}{status === 'error' && <span>⚠️</span>}
            {statusText}
          </div>
        )}

        <button onClick={handlePay} disabled={paying || status === 'success'}
          className="sp-press w-full rounded-[16px] py-4 mb-3 text-[15px] font-extrabold text-white"
          style={{ background: '#0A84FF', boxShadow: '0 8px 24px rgba(10,132,255,0.36)', opacity: paying ? 0.6 : 1 }}>
          {paying ? 'Please wait…' : 'Pay Now'}
        </button>
        <button onClick={handleBack} className="sp-press w-full rounded-[16px] py-4 text-[15px] font-bold text-ink"
          style={{ background: '#F5F5F7', border: '1px solid #EBEBED' }}>
          Back to Plans
        </button>
      </div>
    </div>
  )
}
