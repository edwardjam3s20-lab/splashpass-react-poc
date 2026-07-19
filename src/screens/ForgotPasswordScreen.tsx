import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { V2Field, V2FieldError, V2Input, V2PasswordInput } from '../components/v2/V2Form'
import { PasswordChecklist, isPasswordValid } from '../components/v2/PasswordChecklist'
import { requestPasswordReset, resetPassword, AuthError } from '../lib/auth'
import { useAppStore } from '../store/useAppStore'

type Step = 'request' | 'reset'

export function ForgotPasswordScreen() {
  const navigate = useNavigate()
  const showToast = useAppStore((s) => s.showToast)

  const [step, setStep] = useState<Step>('request')

  // Step 1: request code
  const [email, setEmail] = useState('')
  const [requestError, setRequestError] = useState('')
  const [requestLoading, setRequestLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Step 2: code + new password
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [newPass, setNewPass] = useState('')
  const [newPass2, setNewPass2] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const codeRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  async function handleRequestCode() {
    if (!email.trim() || !email.includes('@')) {
      setRequestError('Please enter a valid email.'); return
    }
    setRequestLoading(true); setRequestError('')
    try {
      await requestPasswordReset(email.trim().toLowerCase())
      setStep('reset')
      setResendCooldown(60)
    } catch (e) {
      setRequestError(e instanceof AuthError ? e.message : 'Something went wrong. Please try again.')
    } finally { setRequestLoading(false) }
  }

  async function handleResend() {
    if (resendCooldown > 0 || requestLoading) return
    setRequestLoading(true)
    try {
      await requestPasswordReset(email.trim().toLowerCase())
      showToast('A new code has been sent to your email.')
      setResendCooldown(60)
      setCode(['', '', '', '', '', ''])
      codeRefs.current[0]?.focus()
    } catch {
      showToast('Network error. Please try again.', true)
    } finally { setRequestLoading(false) }
  }

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[index] = digit
    setCode(next)
    setResetError('')
    if (digit && index < 5) codeRefs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (digits.length === 6) setCode(digits.split(''))
  }

  async function handleResetPassword() {
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setResetError('Please enter the 6-digit code.'); return
    }
    if (!isPasswordValid(newPass)) {
      setResetError('Password must meet all requirements above.'); return
    }
    if (newPass !== newPass2) {
      setResetError('Passwords do not match.'); return
    }
    setResetLoading(true); setResetError('')
    try {
      await resetPassword(email.trim().toLowerCase(), fullCode, newPass)
      showToast('Password reset! Please sign in with your new password.')
      navigate(`/auth/login?email=${encodeURIComponent(email.trim().toLowerCase())}`)
    } catch (e) {
      setResetError(e instanceof AuthError ? e.message : 'Something went wrong. Please try again.')
    } finally { setResetLoading(false) }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto" style={{ background: '#F5F5F7' }}>
      {/* Header */}
      <div
        className="flex flex-col items-center pt-10 pb-8 px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0A1628 0%, #0A2A4A 100%)' }}
      >
        <div style={{
          position: 'absolute', width: 220, height: 220, borderRadius: 110,
          background: '#0A84FF', opacity: 0.07, top: -50, right: -50, pointerEvents: 'none',
        }} />
        <img
          src="/logo.png"
          alt="SplashPass"
          className="h-14 w-14 rounded-[18px] mb-4"
          style={{ boxShadow: '0 10px 30px rgba(10,132,255,0.4)' }}
        />
        <h1 className="text-[22px] font-extrabold text-white text-center" style={{ letterSpacing: '-0.5px' }}>
          {step === 'request' ? 'Reset your password' : 'Enter your code'}
        </h1>
        <p className="text-[13px] text-center mt-1.5 max-w-[280px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {step === 'request'
            ? "Enter your account email and we'll send you a reset code."
            : <>We sent a 6-digit code to <strong style={{ color: '#fff' }}>{email}</strong>.</>}
        </p>
      </div>

      <div className="flex-1 px-6 pt-8 pb-10">
        {step === 'request' ? (
          <div className="sp-fade-up">
            <V2Field label="Email">
              <V2Input type="email" placeholder="you@example.com" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRequestCode()} />
            </V2Field>
            <V2FieldError>{requestError}</V2FieldError>

            <button onClick={handleRequestCode} disabled={requestLoading}
              className="sp-press w-full rounded-[16px] py-4 text-[15px] font-extrabold text-white mt-2"
              style={{
                background: '#0A84FF', boxShadow: '0 8px 24px rgba(10,132,255,0.36)',
                opacity: requestLoading ? 0.7 : 1,
              }}>
              {requestLoading ? 'Sending…' : 'Send reset code'}
            </button>
          </div>
        ) : (
          <div className="sp-fade-up">
            {/* OTP input */}
            <div className="flex gap-3 mb-6 justify-center" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { codeRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-14 w-11 rounded-[14px] text-center text-[22px] font-bold text-ink outline-none transition-all"
                  style={{
                    background: '#fff',
                    border: `2px solid ${resetError ? '#FF3B30' : digit ? '#0A84FF' : '#EBEBED'}`,
                    boxShadow: digit ? '0 2px 8px rgba(10,132,255,0.15)' : 'none',
                  }}
                />
              ))}
            </div>

            <V2Field label="New Password">
              <V2PasswordInput placeholder="Create a new password" autoComplete="new-password"
                value={newPass} onChange={(e) => setNewPass(e.target.value)} />
            </V2Field>
            <PasswordChecklist password={newPass} />
            <V2Field label="Confirm New Password">
              <V2PasswordInput placeholder="Re-enter your new password" autoComplete="new-password"
                value={newPass2} onChange={(e) => setNewPass2(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()} />
            </V2Field>
            <V2FieldError>{resetError}</V2FieldError>

            <button onClick={handleResetPassword} disabled={resetLoading}
              className="sp-press w-full rounded-[16px] py-4 text-[15px] font-extrabold text-white mt-2 mb-5"
              style={{
                background: '#0A84FF', boxShadow: '0 8px 24px rgba(10,132,255,0.36)',
                opacity: resetLoading ? 0.7 : 1,
              }}>
              {resetLoading ? 'Resetting…' : 'Reset password'}
            </button>

            <div className="text-[13px] text-muted text-center">
              Didn't get it?{' '}
              {resendCooldown > 0 ? (
                <span style={{ color: '#8E8E93' }}>Resend in {resendCooldown}s</span>
              ) : (
                <span onClick={handleResend} className="font-bold cursor-pointer" style={{ color: '#0A84FF' }}>
                  Resend code
                </span>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/auth/login')}
          className="mt-8 text-[13px] font-medium block mx-auto"
          style={{ color: '#8E8E93' }}>
          ← Back to sign in
        </button>
      </div>
    </div>
  )
}
