import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export function RequireAuth({ children }: { children: ReactNode }) {
  const currentUser = useAppStore((s) => s.currentUser)
  if (!currentUser) return <Navigate to="/welcome" replace />
  return <>{children}</>
}
