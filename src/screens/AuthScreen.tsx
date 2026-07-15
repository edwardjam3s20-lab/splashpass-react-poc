import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { V2Field, V2FieldError, V2Input, V2PasswordInput } from '../components/v2/V2Form'
import { PasswordChecklist, isPasswordValid } from '../components/v2/PasswordChecklist'
import { loginWithEmail, registerWithEmail, AuthError } from '../lib/auth'
import { useAppStore } from '../store/useAppStore'
import { popResumePath } from '../lib/tokenRefresh'

type Mode = 'login' | 'register'

const API = import.meta.env.VITE_API_BASE_URL as string

// Full-page redirect (not a fetch) — splashmain's /api/auth/google sends
// the browser to Google's consent screen, then Google sends it back to
// splashmain's callback route, which finally redirects here to
// /auth/google/callback with either an error, a pending-verification
// token, or (on full success) nothing but a live session cookie.
function startGoogleAuth() {
  const next = `${window.location.origin}/auth/google/callback`
  window.location.href = `${API}/api/auth/google?next=${encodeURIComponent(next)}`
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.97h3.86c2.26-2.09 3.56-5.17 3.56-8.79z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.97c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.07C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.32c-.25-.72-.39-1.49-.39-2.32s.14-1.6.39-2.32V6.62H1.27A11.96 11.96 0 0 0 0 12c0 1.93.46 3.76 1.27 5.38z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.27 6.62l4 3.06c.95-2.85 3.6-4.93 6.73-4.93z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0F172A" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.36 13.15c-.03-2.06 1.69-3.05 1.76-3.1-.96-1.4-2.45-1.6-2.98-1.62-1.36-.14-2.65.79-3.34.79-.71 0-1.78-.77-2.92-.75-1.51.02-2.92.88-3.69 2.24-1.57 2.73-.4 6.76 1.13 8.97.75 1.08 1.64 2.29 2.81 2.25 1.13-.04 1.56-.74 2.92-.74 1.36 0 1.75.74 2.93.72 1.21-.02 1.98-1.1 2.72-2.18.86-1.27 1.21-2.5 1.23-2.57-.03-.01-2.55-.98-2.57-3.01zM13.83 5.06c.59-.72 1-1.71.89-2.71-.86.04-1.9.58-2.51 1.29-.55.62-1.03 1.62-.9 2.58.94.07 1.91-.48 2.52-1.16z" />
    </svg>
  )
}

export function AuthScreen() {
  const { mode: routeMode } = useParams<{ mode: string }>()
  const mode: Mode = routeMode === 'register' ? 'register' : 'login'
  const navigate = useNavigate()
  const showToast = useAppStore((s) => s.showToast)
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass]   = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Register state
  const [regName, setRegName]   = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPass, setRegPass]   = useState('')
  const [regPass2, setRegPass2] = useState('')
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  async function handleLogin() {
    setLoginLoading(true); setLoginError('')
    try {
      const result = await loginWithEmail(loginEmail, loginPass)
      if (result.needsEmailVerification) {
        // Account exists but email not verified — resume verification flow
        navigate(`/verify/email?email=${encodeURIComponent(loginEmail.trim().toLowerCase())}&token=${encodeURIComponent(result.pendingToken!)}`)
        return
      }
      if (result.needsPhoneVerification) {
        // Email verified but phone not — skip to phone step
        navigate(`/verify/phone?email=${encodeURIComponent(loginEmail.trim().toLowerCase())}&token=${encodeURIComponent(result.pendingToken!)}`)
        return
      }
      setCurrentUser(result.user!)
      // If they got here because a dead refresh token bounced them out of
      // somewhere else (not a fresh, voluntary login), return them exactly
      // there instead of resetting to /home — that's the "graceful" part
      // of graceful re-auth: no lost booking cart, no lost draft.
      navigate(popResumePath() || '/home')
    } catch (e) {
      setLoginError(e instanceof AuthError ? e.message : 'Something went wrong. Please try again.')
    } finally { setLoginLoading(false) }
  }

  async function handleRegister() {
    if (!regName || !regEmail || !regPhone || !regPass) {
      setRegError('Please fill in all fields.'); return
    }
    if (!/^\+\d{7,15}$/.test(regPhone.trim())) {
      setRegError('Phone must be in international format e.g. +254712345678'); return
    }
    if (!isPasswordValid(regPass)) {
      setRegError('Password must meet all requirements above.'); return
    }
    if (regPass !== regPass2) {
      setRegError('Passwords do not match.'); return
    }
    setRegLoading(true); setRegError('')
    try {
      const { pendingToken } = await registerWithEmail(regName, regEmail, regPhone, regPass)
      // Email OTP already sent by the register route — go straight to verify
      navigate(`/verify/email?email=${encodeURIComponent(regEmail.trim().toLowerCase())}&token=${encodeURIComponent(pendingToken)}`)
    } catch (e) {
      setRegError(e instanceof AuthError ? e.message : 'Something went wrong. Please try again.')
    } finally { setRegLoading(false) }
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
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-[13px] text-xl"
            style={{ background: 'linear-gradient(135deg, #00C6BE, #0A84FF)', boxShadow: '0 6px 20px rgba(10,132,255,0.4)' }}>
            💧
          </div>
          <div>
            <div className="text-[17px] font-extrabold text-white" style={{ letterSpacing: '-0.4px' }}>SplashPass</div>
            <div className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Premium Car Care</div>
          </div>
        </div>

        {/* Mode switcher */}
        <div className="w-full max-w-[320px] flex rounded-[14px] p-1"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {(['login', 'register'] as Mode[]).map((m) => (
            <button key={m} onClick={() => navigate(`/auth/${m}`)}
              className="flex-1 rounded-[11px] py-2.5 text-[13px] font-bold transition-all"
              style={{
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#0D0D0D' : 'rgba(255,255,255,0.5)',
                boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
              }}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 px-5 pt-6 pb-8">
        {mode === 'login' ? (
          <div className="sp-fade-up">
            <h1 className="text-[24px] font-extrabold text-ink mb-1.5" style={{ letterSpacing: '-0.5px' }}>
              Welcome back
            </h1>
            <p className="text-[14px] text-muted mb-6 leading-relaxed">
              Sign in to your SplashPass account.
            </p>

            <V2Field label="Email Address">
              <V2Input type="email" placeholder="you@example.com" autoComplete="email"
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            </V2Field>
            <V2Field label="Password">
              <V2PasswordInput placeholder="Your password" autoComplete="current-password"
                value={loginPass} onChange={(e) => setLoginPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            </V2Field>

            <div className="text-right mb-4">
              <span className="text-[13px] font-semibold cursor-pointer" style={{ color: '#0A84FF' }}>
                Forgot password?
              </span>
            </div>

            <V2FieldError>{loginError}</V2FieldError>

            <button onClick={handleLogin} disabled={loginLoading}
              className="sp-press w-full rounded-[16px] py-4 text-[15px] font-extrabold text-white mb-5"
              style={{
                background: '#0A84FF', boxShadow: '0 8px 24px rgba(10,132,255,0.36)',
                opacity: loginLoading ? 0.6 : 1, letterSpacing: '-0.2px',
              }}>
              {loginLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: '#EBEBED' }} />
              <span className="text-[12px] text-muted font-medium">or continue with</span>
              <div className="flex-1 h-px" style={{ background: '#EBEBED' }} />
            </div>

            <button onClick={startGoogleAuth}
              className="sp-press w-full flex items-center justify-center gap-2.5 rounded-[14px] py-3.5 mb-5 text-[14px] font-semibold text-ink"
              style={{ background: '#fff', border: '1.5px solid #EBEBED' }}>
              <GoogleIcon /> Continue with Google
            </button>

            <div className="text-center text-[13px] text-muted">
              No account?{' '}
              <span onClick={() => navigate('/auth/register')}
                className="font-bold cursor-pointer" style={{ color: '#0A84FF' }}>
                Sign up free
              </span>
            </div>
          </div>
        ) : (
          <div className="sp-fade-up">
            <h1 className="text-[24px] font-extrabold text-ink mb-1.5" style={{ letterSpacing: '-0.5px' }}>
              Create your account
            </h1>
            <p className="text-[14px] text-muted mb-6 leading-relaxed">
              30-day free trial — no card required.
            </p>

            <V2Field label="Full Name">
              <V2Input type="text" placeholder="James Edward" autoComplete="name"
                value={regName} onChange={(e) => setRegName(e.target.value)} />
            </V2Field>
            <V2Field label="Email Address">
              <V2Input type="email" placeholder="you@example.com" autoComplete="email"
                value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            </V2Field>
            <V2Field label="Phone Number">
              <V2Input type="tel" placeholder="+254712345678" autoComplete="tel"
                value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
              <p className="text-[11px] mt-1" style={{ color: '#8E8E93' }}>
                International format required — e.g. +254 for Kenya
              </p>
            </V2Field>
            <V2Field label="Password">
              <V2PasswordInput placeholder="Create a password" autoComplete="new-password"
                value={regPass} onChange={(e) => setRegPass(e.target.value)} />
            </V2Field>
            <V2Field label="Confirm Password">
              <V2Input type="password" placeholder="Repeat password" autoComplete="new-password"
                value={regPass2} onChange={(e) => setRegPass2(e.target.value)} />
            </V2Field>

            <PasswordChecklist password={regPass} />
            <V2FieldError>{regError}</V2FieldError>

            <button onClick={handleRegister} disabled={regLoading}
              className="sp-press w-full rounded-[16px] py-4 text-[15px] font-extrabold text-white mb-4"
              style={{
                background: '#0A84FF', boxShadow: '0 8px 24px rgba(10,132,255,0.36)',
                opacity: regLoading ? 0.6 : 1, letterSpacing: '-0.2px',
              }}>
              {regLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Creating account…
                </span>
              ) : 'Continue →'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: '#EBEBED' }} />
              <span className="text-[12px] text-muted font-medium">or continue with</span>
              <div className="flex-1 h-px" style={{ background: '#EBEBED' }} />
            </div>

            {[
              { icon: <GoogleIcon />, label: 'Continue with Google', action: startGoogleAuth },
              { icon: <AppleIcon />, label: 'Continue with Apple',  action: () => showToast('Apple sign-in coming soon.') },
            ].map((b) => (
              <button key={b.label} onClick={b.action}
                className="sp-press w-full flex items-center justify-center gap-2.5 rounded-[14px] py-3.5 mb-2.5 text-[14px] font-semibold text-ink"
                style={{ background: '#fff', border: '1.5px solid #EBEBED' }}>
                {b.icon} {b.label}
              </button>
            ))}

            <div className="text-center text-[13px] text-muted mt-4">
              Already have an account?{' '}
              <span onClick={() => navigate('/auth/login')}
                className="font-bold cursor-pointer" style={{ color: '#0A84FF' }}>
                Sign in
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
