import type { Profile } from '../types/database'

const TRIAL_DAYS = 30

export function getTrialDaysLeft(user: Profile | null): number {
  if (!user?.created_at) return 0
  const created = new Date(user.created_at).getTime()
  const now = Date.now()
  const diff = Math.ceil((created + TRIAL_DAYS * 24 * 60 * 60 * 1000 - now) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

export function isOnTrial(user: Profile | null): boolean {
  if (!user) return false
  return (
    getTrialDaysLeft(user) > 0 &&
    (!user.sub_status || user.sub_status === 'trial' || user.sub_status === 'pending')
  )
}

export function hasActiveAccess(user: Profile | null): boolean {
  if (isOnTrial(user)) return true
  return user?.sub_status === 'active'
}
