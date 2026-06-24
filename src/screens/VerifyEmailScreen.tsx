import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { V2Screen, V2Logo, V2Spacer } from '../components/v2/V2Layout'
import { V2Button } from '../components/v2/V2Button'
import { useAppStore } from '../store/useAppStore'

export function VerifyEmailScreen() {
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const navigate = useNavigate()
  const showToast = useAppStore((s) => s.showToast)
  const [continuing, setContinuing] = useState(false)

  function handleContinue() {
    setContinuing(true)
    // Mirrors the original's brief artificial delay before advancing
    setTimeout(() => {
      setContinuing(false)
      navigate('/profile-setup')
    }, 500)
  }

  return (
    <V2Screen>
      <V2Logo />

      <div className="v2-fade-up d1 mb-1.5 flex w-full items-center justify-center">
        <svg viewBox="0 0 320 240" className="w-full max-w-[280px]">
          <ellipse cx="160" cy="146" rx="150" ry="94" fill="#EFF6FF" />
          <g className="v2-float">
            <rect x="68" y="68" width="184" height="122" rx="16" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
            <path d="M68 84 L160 150 L252 84 L252 76 L160 140 L68 76 Z" fill="#DBEAFE" />
            <path d="M68 84 L160 150 L252 84" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <circle cx="246" cy="172" r="28" fill="#10B981" />
          <path d="M234 172l8 8 16-17" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M36 66l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#F5A623" />
          <circle cx="276" cy="56" r="5" fill="#2563EB" opacity=".3" />
          <circle cx="46" cy="176" r="6" fill="#2563EB" opacity=".18" />
        </svg>
      </div>

      <h1 className="v2-fade-up d2 mb-2 text-center text-[26px] font-extrabold leading-tight tracking-tight">
        Check Your Email
      </h1>
      <p className="v2-fade-up d2 mb-4.5 text-center text-base leading-relaxed text-v2-text2">
        We've sent a verification link to:
      </p>
      <div className="v2-fade-up d2 mb-6 flex items-center justify-center gap-2 rounded-2xl bg-v2-subtle px-4.5 py-3 text-center text-[14.5px] font-bold text-v2-primary break-all">
        {email || 'you@example.com'}
      </div>

      <div className="v2-fade-up d3 flex flex-col gap-3">
        <V2Button loading={continuing} onClick={handleContinue}>
          Continue →
        </V2Button>
        <V2Button variant="secondary" onClick={() => window.open('https://mail.google.com', '_blank')}>
          Open Gmail
        </V2Button>
        <div className="flex gap-3">
          <div className="flex-1">
            <V2Button variant="ghost" onClick={() => showToast('Verification email sent.')}>
              Resend Email
            </V2Button>
          </div>
          <div className="flex-1">
            <V2Button variant="ghost" onClick={() => navigate('/auth/register')}>
              Change Email
            </V2Button>
          </div>
        </div>
      </div>

      <V2Spacer />

      <div className="v2-fade-up d4 mt-6 flex flex-wrap items-center justify-center gap-x-4.5 gap-y-2">
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-v2-text2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Your information is encrypted and secure.
        </div>
      </div>
    </V2Screen>
  )
}
