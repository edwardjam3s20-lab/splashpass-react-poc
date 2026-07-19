import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
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

  // NOTE: this app defers phone verification — a Google signup gets a full
  // session with phone_verified still false and is expected to be able to
  // use the rest of the app right away (see the comment in splashmain's
  // google/callback/route.js). An earlier version of this file redirected
  // any phone_verified===false session straight to /profile-setup on every
  // route, which broke that: ProfileSetupScreen's own navigate('/onboarding')
  // got bounced right back here, since saving a phone doesn't set
  // phone_verified — nothing in this app currently does. The actual
  // concern that guard was trying to address (a placeholder phone from a
  // NOT NULL retry in google/callback/route.js reaching BookScreen's
  // M-Pesa/SMS calls) belongs at the point of payment, not here — see the
  // phone check added in BookScreen.tsx instead.

  return <>{children}</>
}
