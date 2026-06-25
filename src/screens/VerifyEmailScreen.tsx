import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export function VerifyEmailScreen() {
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const navigate = useNavigate()
  const showToast = useAppStore((s) => s.showToast)
  const [continuing, setContinuing] = useState(false)

  function handleContinue() {
    setContinuing(true)
    setTimeout(() => { setContinuing(false); navigate('/profile-setup') }, 500)
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center" style={{ background: '#F5F5F7' }}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full text-[36px] mb-5 sp-float"
        style={{ background: 'linear-gradient(135deg, #E0FAF9, #D0F0FF)', border: '2px solid rgba(10,132,255,0.15)' }}>
        📧
      </div>
      <div className="text-[24px] font-extrabold text-ink mb-2" style={{ letterSpacing: '-0.5px' }}>Verify your email</div>
      <p className="text-[14px] text-muted leading-relaxed mb-2">
        We sent a verification link to:
      </p>
      <div className="rounded-[12px] px-4 py-2 mb-8 text-[14px] font-bold text-ink" style={{ background: '#fff', border: '1px solid #EBEBED' }}>
        {email || 'your email address'}
      </div>
      <div className="w-full max-w-sm">
        <button onClick={handleContinue} disabled={continuing}
          className="sp-press w-full rounded-[16px] py-4 mb-3 text-[15px] font-extrabold text-white"
          style={{ background: '#0A84FF', boxShadow: '0 8px 24px rgba(10,132,255,0.36)', opacity: continuing ? 0.6 : 1 }}>
          {continuing ? 'Loading…' : "I've verified — Continue →"}
        </button>
        <button onClick={() => showToast('Check your spam folder too!')}
          className="sp-press w-full rounded-[16px] py-4 text-[14px] font-semibold text-muted"
          style={{ background: '#fff', border: '1px solid #EBEBED' }}>
          Resend email
        </button>
      </div>
    </div>
  )
}
