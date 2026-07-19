import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export function SplashScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(currentUser ? '/home' : '/welcome', { replace: true })
    }, 1400)
    return () => clearTimeout(timer)
  }, [currentUser, navigate])

  return (
    <div
      className="flex h-full flex-col items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0A1628 0%, #0A2A4A 100%)' }}
    >
      {/* Logo */}
      <div className="sp-float mb-5">
        <img
          src="/logo.png"
          alt="SplashPass"
          className="h-20 w-20 rounded-[24px]"
          style={{ boxShadow: '0 16px 48px rgba(10,132,255,0.4)' }}
        />
      </div>
      <div
        className="text-[28px] font-extrabold text-white mb-1.5"
        style={{ letterSpacing: '-0.8px' }}
      >
        SplashPass
      </div>
      <div className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
        Premium Car Care
      </div>

      {/* Loading dots */}
      <div className="flex gap-1.5 mt-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.3)',
              animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
