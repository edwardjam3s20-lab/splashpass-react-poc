import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

const API = import.meta.env.VITE_API_BASE_URL as string

export function VerifyPhoneScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email        = params.get('email') ?? ''
  const pendingToken = params.get('token') ?? ''
  const showToast = useAppStore((s) => s.showToast)
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  useEffect(() => {
    if (!email || !pendingToken) navigate('/auth/register')
  }, [email, pendingToken, navigate])

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[index] = digit
    setCode(next)
    setError('')
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
    if (next.every((d) => d !== '')) submitCode(next.join(''))
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (digits.length === 6) {
      setCode(digits.split(''))
      submitCode(digits)
    }
  }

  async function submitCode(fullCode: string) {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/api/verify/phone-verify`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ email, pendingToken, code: fullCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Verification failed. Please try again.')
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        return
      }
      // Both verified — full session cookie set by server, log user in
      setCurrentUser(data.user)
      showToast('Account verified! Welcome to SplashPass 🎉')
      navigate('/home')
    } catch {
      setError('Network error. Please try again.')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  async function resendCode() {
    if (resendCooldown > 0 || resending) return
    setResending(true)
    try {
      const res = await fetch(`${API}/api/verify/phone-send`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ email, pendingToken }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('A new code has been sent to your phone.')
        setResendCooldown(60)
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        showToast(data.error || 'Failed to resend. Please try again.', true)
      }
    } catch {
      showToast('Network error. Please try again.', true)
    } finally { setResending(false) }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10"
      style={{ background: '#F5F5F7' }}>

      {/* Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] text-4xl"
        style={{ background: 'linear-gradient(135deg, #30D158, #00C6BE)', boxShadow: '0 8px 28px rgba(48,209,88,0.3)' }}>
        📱
      </div>

      <h1 className="text-[26px] font-extrabold text-ink mb-2 text-center" style={{ letterSpacing: '-0.5px' }}>
        Verify your phone
      </h1>
      <p className="text-[14px] text-muted text-center mb-8 leading-relaxed max-w-[280px]">
        We sent a 6-digit code to the phone number on your account. Enter it below to complete signup.
      </p>

      {/* OTP input */}
      <div className="flex gap-3 mb-6" onPaste={handlePaste}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-14 w-11 rounded-[14px] text-center text-[22px] font-bold text-ink outline-none transition-all"
            style={{
              background: '#fff',
              border: `2px solid ${error ? '#FF3B30' : digit ? '#30D158' : '#EBEBED'}`,
              boxShadow: digit ? '0 2px 8px rgba(48,209,88,0.15)' : 'none',
            }}
          />
        ))}
      </div>

      {error && (
        <p className="text-[13px] font-medium mb-4 text-center" style={{ color: '#FF3B30' }}>
          {error}
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 mb-4">
          <span className="h-4 w-4 rounded-full border-2 border-green-200 border-t-green-500 animate-spin" />
          <span className="text-[13px] text-muted">Verifying…</span>
        </div>
      )}

      {/* Resend */}
      <div className="text-[13px] text-muted text-center">
        Didn't get it?{' '}
        {resendCooldown > 0 ? (
          <span style={{ color: '#8E8E93' }}>Resend in {resendCooldown}s</span>
        ) : (
          <span
            onClick={resendCode}
            className="font-bold cursor-pointer"
            style={{ color: resending ? '#8E8E93' : '#30D158' }}>
            {resending ? 'Sending…' : 'Resend code'}
          </span>
        )}
      </div>

      <button
        onClick={() => navigate(-1)}
        className="mt-8 text-[13px] font-medium"
        style={{ color: '#8E8E93' }}>
        ← Back
      </button>
    </div>
  )
}
