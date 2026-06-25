import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export function SubWallScreen() {
  const navigate = useNavigate()
  const logout = useAppStore((s) => s.logout)

  function handleLogout() { logout(); navigate('/welcome') }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-white px-6 text-center">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full text-[36px] mx-auto"
          style={{ background: 'linear-gradient(135deg, #1C2E4A, #0A1628)', boxShadow: '0 12px 40px rgba(10,22,40,0.25)' }}>
          🔒
        </div>
      </div>
      <div className="text-[26px] font-extrabold text-ink mb-3" style={{ letterSpacing: '-0.6px' }}>
        Trial Ended
      </div>
      <div className="text-[14px] text-muted leading-relaxed mb-8 max-w-[280px]">
        Your 30-day free trial has ended. Subscribe to keep booking washes at any SplashPass point.
      </div>

      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate('/plans')}
          className="sp-press w-full rounded-[16px] py-4 mb-3 text-[15px] font-extrabold text-white"
          style={{ background: '#0A84FF', boxShadow: '0 8px 24px rgba(10,132,255,0.36)' }}>
          View Plans →
        </button>
        <button
          onClick={handleLogout}
          className="sp-press w-full rounded-[16px] py-4 text-[15px] font-bold text-ink"
          style={{ background: '#F5F5F7', border: '1px solid #EBEBED' }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
