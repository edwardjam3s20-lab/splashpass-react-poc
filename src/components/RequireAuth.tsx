import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import {
  scheduleSilentRefresh,
  stopSilentRefresh,
  registerHardLogoutHandler,
  saveResumePath,
} from '../lib/tokenRefresh'

export function RequireAuth({ children }: { children: ReactNode }) {
  const currentUser = useAppStore((s) => s.currentUser)
  const logout = useAppStore((s) => s.logout)
  const location = useLocation()

  useEffect(() => {
    if (!currentUser) return

    // "Hard logout" only fires when the refresh token itself is dead
    // (expired past 30 days, or revoked — e.g. reuse detection). Every
    // other case (the normal 15-min access token cycle) is handled
    // invisibly by scheduleSilentRefresh/apiFetch and never reaches here.
    registerHardLogoutHandler(() => {
      saveResumePath()
      logout()
    })

    scheduleSilentRefresh()
    return () => stopSilentRefresh()
  }, [currentUser, logout])

  if (!currentUser) {
    saveResumePath()
    return <Navigate to="/welcome" replace />
  }

  // A password-based login never reaches a full session (currentUser set)
  // while phone_verified is false — that path returns a pendingToken and
  // routes through /verify/phone instead. The only way to land here with
  // phone_verified false is a Google signup that hasn't finished
  // /profile-setup yet, where currentUser.phone may still be empty or an
  // internal placeholder (see splashmain's google/callback route) — not
  // safe to use for booking/M-Pesa/SMS, so send them to finish that first.
  if (currentUser.phone_verified === false && location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" replace />
  }

  return <>{children}</>
}
