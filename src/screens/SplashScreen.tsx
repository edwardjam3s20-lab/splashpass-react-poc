import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export function SplashScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)

  useEffect(() => {
    const id = setTimeout(() => {
      navigate(currentUser ? '/home' : '/welcome', { replace: true })
    }, 900)
    return () => clearTimeout(id)
  }, [currentUser, navigate])

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-v2-primary">
      <div className="v2-float flex h-16 w-16 items-center justify-center rounded-[18px] bg-white font-v2-display text-2xl font-extrabold text-v2-primary shadow-v2-logo">
        S
      </div>
      <div className="mt-4 font-v2-display text-lg font-bold text-white">SplashPass</div>
    </div>
  )
}
