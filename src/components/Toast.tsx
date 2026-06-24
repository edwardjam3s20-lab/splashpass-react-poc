import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export function Toast() {
  const message = useAppStore((s) => s.toastMessage)
  const isError = useAppStore((s) => s.toastIsError)
  const hideToast = useAppStore((s) => s.hideToast)

  useEffect(() => {
    if (!message) return
    const id = setTimeout(hideToast, 3000)
    return () => clearTimeout(id)
  }, [message, hideToast])

  return (
    <div
      className={[
        'fixed left-1/2 top-6 z-[999] -translate-x-1/2 whitespace-nowrap overflow-hidden text-ellipsis',
        'max-w-[90vw] rounded-2xl border-l-4 px-5.5 py-3.5 text-sm text-white shadow-app-lg transition-all duration-300',
        isError ? 'border-l-danger' : 'border-l-gold',
        message ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none',
      ].join(' ')}
      style={{ backgroundColor: '#1A2755' }}
    >
      {message}
    </div>
  )
}
