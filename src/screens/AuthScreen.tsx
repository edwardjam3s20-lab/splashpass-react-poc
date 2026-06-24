import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { V2Screen, V2Logo } from '../components/v2/V2Layout'
import { V2Button } from '../components/v2/V2Button'
import { V2Field, V2FieldError, V2Input, V2PasswordInput } from '../components/v2/V2Form'
import { PasswordChecklist, isPasswordValid } from '../components/v2/PasswordChecklist'
import { loginWithEmail, registerWithEmail, AuthError } from '../lib/auth'
import { useAppStore } from '../store/useAppStore'

type Mode = 'login' | 'register'

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

  // login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // register state
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regPass2, setRegPass2] = useState('')
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  async function handleLogin() {
    setLoginLoading(true)
    setLoginError('')
    try {
      const user = await loginWithEmail(loginEmail, loginPass)
      setCurrentUser(user)
      navigate('/home') // initApp() handles trial/sub-wall routing inside HomeScreen's guard
    } catch (e) {
      setLoginError(e instanceof AuthError ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleRegister() {
    if (!regEmail || !regPass) {
      setRegError('Please fill in all fields.')
      return
    }
    if (!isPasswordValid(regPass)) {
      setRegError('Password must meet all requirements above.')
      return
    }
    if (regPass !== regPass2) {
      setRegError('Passwords do not match.')
      return
    }
    setRegLoading(true)
    setRegError('')
    try {
      const user = await registerWithEmail(regEmail, regPass)
      setCurrentUser(user)
      navigate(`/verify?email=${encodeURIComponent(regEmail.trim().toLowerCase())}`)
    } catch (e) {
      setRegError(e instanceof AuthError ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <V2Screen>
      <V2Logo />

      {mode === 'login' ? (
        <div>
          <div className="v2-fade-up d1">
            <h1 className="mb-2 text-[26px] font-extrabold leading-tight tracking-tight">Welcome back</h1>
            <p className="mb-7 text-base leading-relaxed text-v2-text2">
              Sign in to continue to your account.
            </p>
          </div>
          <div className="v2-fade-up d2">
            <V2Field label="Email Address">
              <V2Input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </V2Field>
            <V2Field label="Password">
              <V2PasswordInput
                placeholder="Your password"
                autoComplete="current-password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </V2Field>
            <V2FieldError>{loginError}</V2FieldError>
            <div className="mt-1.5 mb-4.5">
              <V2Button loading={loginLoading} onClick={handleLogin}>
                Sign In
              </V2Button>
            </div>
            <div className="text-center text-sm text-v2-text2">
              No account?{' '}
              <a
                onClick={() => navigate('/auth/register')}
                className="cursor-pointer font-bold text-v2-primary hover:underline"
              >
                Sign up
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="v2-fade-up d1">
            <h1 className="mb-2 text-[26px] font-extrabold leading-tight tracking-tight">
              Create your account
            </h1>
            <p className="mb-7 text-base leading-relaxed text-v2-text2">
              Start your 30-day free trial — no card required.
            </p>
          </div>
          <div className="v2-fade-up d2">
            <V2Field label="Email Address">
              <V2Input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </V2Field>
            <V2Field label="Password">
              <V2PasswordInput
                placeholder="Create a password"
                autoComplete="new-password"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
              />
            </V2Field>
            <V2Field label="Confirm Password">
              <V2Input
                type="password"
                placeholder="Repeat password"
                autoComplete="new-password"
                value={regPass2}
                onChange={(e) => setRegPass2(e.target.value)}
              />
            </V2Field>

            <PasswordChecklist password={regPass} />

            <V2FieldError>{regError}</V2FieldError>
            <div className="mt-0.5 mb-4.5">
              <V2Button loading={regLoading} onClick={handleRegister}>
                Continue →
              </V2Button>
            </div>

            <div className="my-5.5 flex items-center gap-3 text-[13px] font-medium text-v2-text2">
              <div className="h-px flex-1 bg-v2-border" />
              or continue with
              <div className="h-px flex-1 bg-v2-border" />
            </div>

            <div className="mb-3">
              <V2Button
                variant="secondary"
                onClick={() => showToast('Google sign-in is coming soon.')}
              >
                <GoogleIcon /> Continue with Google
              </V2Button>
            </div>
            <V2Button variant="secondary" onClick={() => showToast('Apple sign-in is coming soon.')}>
              <AppleIcon /> Continue with Apple
            </V2Button>

            <div className="mt-5.5 text-center text-sm text-v2-text2">
              Have an account?{' '}
              <a
                onClick={() => navigate('/auth/login')}
                className="cursor-pointer font-bold text-v2-primary hover:underline"
              >
                Sign in
              </a>
            </div>
          </div>
        </div>
      )}
    </V2Screen>
  )
}
