// src/lib/referrals.ts
// Two responsibilities:
//   1. Capture a `?ref=CODE` from a shared link, on whatever screen it
//      lands on, and hold it in localStorage until registration actually
//      happens (the user might browse Welcome/Legal before signing up).
//   2. Fetch the current user's own referral code + stats from
//      splashmain's /api/referrals for the "Refer a Friend" sheet.

const PENDING_REF_KEY = 'sp_pending_referral_code'

const SPLASHMAIN_BASE = import.meta.env.VITE_SPLASHMAIN_URL || 'https://splashmain.vercel.app'

/**
 * Call once on app mount. Looks for ?ref=CODE in the current URL and, if
 * present, stashes it for the registration form to pick up later — a
 * referral link might land on /welcome, /auth/register, or a legal page
 * shared alongside it, so this isn't tied to one route.
 */
export function captureReferralFromUrl(): void {
  const params = new URLSearchParams(window.location.search)
  const ref = params.get('ref')
  if (ref && ref.trim()) {
    try {
      localStorage.setItem(PENDING_REF_KEY, ref.trim().toUpperCase())
    } catch {
      // Storage can fail in private-browsing edge cases — non-critical,
      // the user can still enter the code manually on the register form.
    }
  }
}

export function getPendingReferralCode(): string {
  try {
    return localStorage.getItem(PENDING_REF_KEY) || ''
  } catch {
    return ''
  }
}

export function clearPendingReferralCode(): void {
  try {
    localStorage.removeItem(PENDING_REF_KEY)
  } catch {
    // no-op
  }
}

export interface ReferralStatus {
  referral_code: string
  referral_count: number
  points_earned: number
  bonus_per_referral: number
}

export async function fetchReferralStatus(): Promise<ReferralStatus | null> {
  try {
    const res = await fetch(`${SPLASHMAIN_BASE}/api/referrals`, { credentials: 'include' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export function buildReferralShareText(code: string): string {
  return `Wash your car the easy way \u2014 book instantly on SplashPass. Use my code ${code} when you sign up: https://app.splashpass.site/welcome?ref=${code}`
}
