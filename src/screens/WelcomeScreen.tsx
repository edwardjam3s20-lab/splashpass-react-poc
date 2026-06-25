import { useNavigate } from 'react-router-dom'

const FEATURES = [
  { icon: '📅', label: 'Book in 3 taps', sub: 'Select service, date, and pay via M-Pesa' },
  { icon: '🔲', label: 'QR Wash Pass', sub: 'Instant QR code delivered after booking' },
  { icon: '🏷', label: 'Member pricing', sub: 'No per-booking app fee on subscription' },
  { icon: '🛡', label: 'Trusted partners', sub: 'Verified wash points across Mombasa' },
]

export function WelcomeScreen() {
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col overflow-y-auto" style={{ background: '#F5F5F7' }}>
      {/* Hero gradient */}
      <div
        className="flex flex-col items-center pt-12 pb-10 px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0A1628 0%, #0A2A4A 100%)' }}
      >
        {/* Glow */}
        <div style={{
          position: 'absolute', width: 280, height: 280, borderRadius: 140,
          background: '#0A84FF', opacity: 0.08, top: -60, right: -60, pointerEvents: 'none',
        }} />

        <div
          className="sp-float flex h-16 w-16 items-center justify-center rounded-[20px] text-[32px] mb-5"
          style={{
            background: 'linear-gradient(135deg, #00C6BE, #0A84FF)',
            boxShadow: '0 12px 40px rgba(10,132,255,0.4)',
          }}
        >
          💧
        </div>

        <div className="text-[13px] font-bold mb-2" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          SplashPass
        </div>
        <h1
          className="text-[32px] font-extrabold text-white text-center leading-tight"
          style={{ letterSpacing: '-0.8px', marginBottom: 12 }}
        >
          Unlimited Car Wash Access
        </h1>
        <p className="text-[14px] text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 280 }}>
          Book washes instantly, check in with QR codes, and enjoy member-only pricing across Mombasa.
        </p>
      </div>

      {/* Feature cards */}
      <div className="px-4 py-5 flex-1">
        {FEATURES.map((f, i) => (
          <div
            key={f.label}
            className="sp-fade-up flex items-center gap-3.5 rounded-[16px] bg-white p-4 mb-2.5"
            style={{
              border: '1px solid #EBEBED',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              animationDelay: `${i * 0.07}s`,
            }}
          >
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[13px] text-xl"
              style={{ background: 'rgba(10,132,255,0.08)' }}
            >
              {f.icon}
            </div>
            <div>
              <div className="text-[14px] font-bold text-ink">{f.label}</div>
              <div className="text-[12px] text-muted mt-0.5">{f.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="px-4 pb-8 pt-2">
        <button
          onClick={() => navigate('/auth/register')}
          className="sp-press w-full rounded-[16px] py-4 mb-3 text-[16px] font-extrabold text-white"
          style={{ background: '#0A84FF', boxShadow: '0 8px 24px rgba(10,132,255,0.36)', letterSpacing: '-0.2px' }}
        >
          Get Started →
        </button>
        <button
          onClick={() => navigate('/auth/login')}
          className="sp-press w-full rounded-[16px] py-4 text-[16px] font-bold text-ink"
          style={{ background: '#fff', border: '1.5px solid #EBEBED' }}
        >
          Sign In
        </button>
        <div className="text-center mt-4 text-[12px] text-muted">
          30-day free trial · No credit card needed
        </div>
      </div>
    </div>
  )
}
