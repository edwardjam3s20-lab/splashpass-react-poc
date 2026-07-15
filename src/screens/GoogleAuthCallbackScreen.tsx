import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { getUserByEmail } from '../lib/auth'
import { popResumePath } from '../lib/tokenRefresh'

// Lands here after splashmain's /api/auth/google/callback redirects the
// browser back. Three outcomes, distinguished by query params:
//   1. ?googleAuthError=...      -> bounce to login with a toast
//   2. ?pendingToken=&email=&needsPhone=1 -> same "pending" path AuthScreen
//      uses for password-login accounts that still need phone verification
//   3. no params, session cookies already set by the server -> just need
//      to hydrate `currentUser` in the store (the redirect itself doesn't
//      carry the user object, unlike the JSON login/register responses)
export function GoogleAuthCallbackScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const showToast = useAppStore((s) => s.showToast)
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const googleAuthError = params.get('googleAuthError')
    const pendingToken = params.get('pendingToken')
    const email = params.get('email')
    const needsPhone = params.get('needsPhone')

    if (googleAuthError) {
      const messages: Record<string, string> = {
        google_denied: 'Google sign-in was cancelled.',
        invalid_state: 'That sign-in link expired. Please try again.',
        use_operator_app: 'That account is an operator account — use the operator app to log in.',
      }
      showToast(messages[googleAuthError] || 'Google sign-in failed. Please try again.', true)
      navigate('/auth/login', { replace: true })
      return
    }

    if (pendingToken && needsPhone && email) {
      navigate(`/verify/phone?email=${encodeURIComponent(email)}&token=${encodeURIComponent(pendingToken)}`, { replace: true })
      return
    }

    // Success — cookies are set, just need the profile to populate the store.
    getUserByEmail('')
      .then((user) => {
        if (!user) {
          showToast('Signed in, but could not load your profile. Please try again.', true)
          navigate('/auth/login', { replace: true })
          return
        }
        setCurrentUser(user)
        navigate(popResumePath() || '/home', { replace: true })
      })
      .catch(() => {
        showToast('Something went wrong finishing sign-in. Please try again.', true)
        navigate('/auth/login', { replace: true })
      })
  }, [params, navigate, showToast, setCurrentUser])

  return (
    <div className="flex h-full flex-col items-center justify-center" style={{ background: '#F5F5F7' }}>
      <div className="h-8 w-8 rounded-full border-2 border-black/10 border-t-[#0A84FF] animate-spin mb-4" />
      <div className="text-[14px] text-muted font-medium">Finishing sign-in…</div>
    </div>
  )
}
