import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export function Toast() {
  const message = useAppStore((s) => s.toastMessage)
  const isError = useAppStore((s) => s.toastIsError)
  const hideToast = useAppStore((s) => s.hideToast)

  useEffect(() => {
    if (!message) return
    const id = setTimeout(hideToast, 3200)
    return () => clearTimeout(id)
  }, [message, hideToast])

  return (
    <div
      className="fixed left-4 right-4 top-5 z-[999] flex items-center gap-3 whitespace-nowrap overflow-hidden text-ellipsis rounded-[16px] px-4 py-3.5 text-[14px] font-semibold text-white shadow-lg transition-all duration-300"
      style={{
        background: isError ? '#1A0A0A' : '#0A1628',
        border: `1px solid ${isError ? 'rgba(255,59,48,0.3)' : 'rgba(255,255,255,0.1)'}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
        transform: message ? 'translateY(0)' : 'translateY(-80px)',
        opacity: message ? 1 : 0,
        pointerEvents: message ? 'auto' : 'none',
        backdropFilter: 'blur(20px)',
      }}
    >
      <span style={{ fontSize: 16 }}>{isError ? '⚠️' : '✓'}</span>
      {message}
    </div>
  )
}
