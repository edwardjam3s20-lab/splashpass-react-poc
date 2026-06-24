import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export function SubWallScreen() {
  const navigate = useNavigate()
  const logout = useAppStore((s) => s.logout)

  function handleLogout() {
    logout()
    navigate('/welcome')
  }

  return (
    <div className="flex h-full items-center justify-center bg-bg px-6 text-center">
      <div>
        <div className="mb-5 text-[64px]">🔒</div>
        <h2 className="mb-2.5 text-2xl font-extrabold text-navy">Trial Ended</h2>
        <p className="mb-8 text-sm leading-relaxed text-muted">
          Your 30-day free trial has ended. Subscribe to keep booking washes at any SplashPass
          wash point.
        </p>
        {/* Plans screen isn't ported yet — this is a placeholder CTA */}
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="mb-3 w-full rounded-2xl bg-accent py-3.5 text-sm font-bold text-white shadow-app-md"
        >
          View Plans → (coming soon)
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white py-3.5 text-sm font-bold text-navy"
        >
          Log Out
        </button>
      </div>
    </div>
  )
}
