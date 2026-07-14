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

  return <>{children}</>
}
