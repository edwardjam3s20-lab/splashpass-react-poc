import { useNavigate } from 'react-router-dom'
import { V2Screen, V2Logo, V2Spacer } from '../components/v2/V2Layout'
import { V2Button } from '../components/v2/V2Button'

const FEATURES = [
  {
    label: 'Unlimited Bookings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <path d="M3 9h18M8 2v4M16 2v4" />
      </svg>
    ),
  },
  {
    label: 'QR Check-ins',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v.01" />
      </svg>
    ),
  },
  {
    label: 'Exclusive Pricing',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .59 1.41l9.58 9.58a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.82z" />
        <circle cx="8.5" cy="8.5" r="1.5" />
      </svg>
    ),
  },
  {
    label: 'Trusted Wash Partners',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
]

export function WelcomeScreen() {
  const navigate = useNavigate()

  return (
    <V2Screen>
      <V2Logo />

      <div className="v2-fade-up d1 mb-1.5 flex w-full items-center justify-center">
        <svg viewBox="0 0 320 240" className="w-full max-w-[280px]">
          <ellipse cx="160" cy="146" rx="150" ry="94" fill="#EFF6FF" />
          <g className="v2-float">
            <path d="M70 64c0 8-7 14-12 14s-12-6-12-14c0-9 12-22 12-22s12 13 12 22z" fill="#2563EB" opacity=".18" />
            <path d="M268 96c0 7-6 12-10 12s-10-5-10-12c0-8 10-19 10-19s10 11 10 19z" fill="#F5A623" opacity=".35" />
            <path d="M250 50c0 5-4 9-8 9s-8-4-8-9c0-6 8-14 8-14s8 8 8 14z" fill="#2563EB" opacity=".22" />
            <path d="M52 168c-6 0-10-4-10-10 0-9 7-15 16-15l8-22c3-9 11-15 20-15h60c10 0 19 6 23 15l9 22c9 0 16 6 16 15 0 6-4 10-10 10z" fill="#2563EB" />
            <path d="M86 128l8-18c2-5 6-8 11-8h54c5 0 10 3 12 8l8 18z" fill="#FFFFFF" opacity=".92" />
            <rect x="86" y="130" width="148" height="20" rx="6" fill="#1D4ED8" />
            <circle cx="100" cy="170" r="14" fill="#0F172A" />
            <circle cx="100" cy="170" r="5" fill="#F8FAFC" />
            <circle cx="220" cy="170" r="14" fill="#0F172A" />
            <circle cx="220" cy="170" r="5" fill="#F8FAFC" />
            <rect x="14" y="120" width="28" height="5" rx="2.5" fill="#BFDBFE" />
            <rect x="22" y="106" width="20" height="5" rx="2.5" fill="#BFDBFE" />
          </g>
          <g className="v2-float" style={{ animationDelay: '.6s' }}>
            <rect x="210" y="36" width="64" height="64" rx="14" fill="#FFFFFF" stroke="#E5E7EB" />
            <rect x="222" y="48" width="10" height="10" fill="#0F172A" />
            <rect x="240" y="48" width="6" height="6" fill="#0F172A" />
            <rect x="252" y="48" width="10" height="10" fill="#0F172A" />
            <rect x="222" y="64" width="6" height="6" fill="#0F172A" />
            <rect x="234" y="64" width="10" height="10" fill="#0F172A" />
            <rect x="252" y="64" width="6" height="6" fill="#0F172A" />
            <rect x="222" y="78" width="10" height="10" fill="#0F172A" />
            <rect x="240" y="78" width="6" height="6" fill="#0F172A" />
            <rect x="252" y="76" width="10" height="12" fill="#0F172A" />
          </g>
          <path d="M44 196l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#F5A623" />
        </svg>
      </div>

      <h1 className="v2-fade-up d2 mb-3.5 text-[38px] font-extrabold leading-[1.15] tracking-tight">
        Unlimited Car Wash Access
      </h1>
      <p className="v2-fade-up d2 mb-6 text-base leading-relaxed text-v2-text2">
        Book washes instantly, check in with QR codes, and enjoy member-only pricing.
      </p>

      <div className="v2-fade-up d3 flex flex-col gap-3">
        {FEATURES.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-3.5 rounded-2xl border border-v2-border bg-white px-4 py-3.5 transition-all hover:-translate-y-px hover:border-blue-100 hover:shadow-v2-sm"
          >
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] bg-v2-subtle text-v2-primary">
              {f.icon}
            </div>
            <div className="text-[14.5px] font-semibold text-v2-text">{f.label}</div>
          </div>
        ))}
      </div>

      <V2Spacer />

      <div className="v2-fade-up d4 mt-7 flex flex-col gap-3">
        <V2Button onClick={() => navigate('/auth/register')}>Get Started →</V2Button>
        <V2Button variant="secondary" onClick={() => navigate('/auth/login')}>
          Sign In
        </V2Button>
      </div>
    </V2Screen>
  )
}
