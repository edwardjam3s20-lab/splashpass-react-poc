export interface LoyaltyStatus {
  points: number
  tier: string
  discount_addon: number
  discount_premium: number
  next_tier: string | null
  next_tier_at: number | null
  points_to_next: number
  active_redemptions: unknown[]
}

export interface LoyaltyTransaction {
  delta: number
  reason: string
  created_at: string
}

export async function fetchLoyaltyStatus(): Promise<LoyaltyStatus | null> {
  try {
    const res = await fetch('/api/loyalty/status', { credentials: 'same-origin' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function fetchLoyaltyTransactions(): Promise<LoyaltyTransaction[]> {
  try {
    const res = await fetch('/api/loyalty/transactions?limit=20', { credentials: 'same-origin' })
    const data = await res.json()
    return data.transactions ?? []
  } catch {
    return []
  }
}

export async function redeemLoyaltyItem(
  redemptionType: string
): Promise<{ ok: boolean; label?: string; pointsRemaining?: number; error?: string }> {
  try {
    const res = await fetch('/api/loyalty/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redemption_type: redemptionType }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error || 'Redemption failed' }
    return { ok: true, label: data.label, pointsRemaining: data.points_remaining }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong.' }
  }
}

export const LEDGER_REASON_LABELS: Record<string, string> = {
  booking_complete: 'Booking completed',
  review_bonus: 'Review bonus',
  referral_bonus: 'Referral bonus',
  streak_bonus: 'Streak bonus',
  monthly_bonus: 'Monthly bonus',
  cap_forfeited: 'Points cap adjustment',
  escrowed: 'Points held',
  redemption_priority_slot: 'Redeemed: Priority slot',
  redemption_priority_month: 'Redeemed: Priority queue',
  redemption_cancellation_window: 'Redeemed: Cancellation window',
  redemption_early_access: 'Redeemed: Early access',
  redemption_partner_voucher: 'Redeemed: Partner voucher',
  redemption_platinum_concierge: 'Redeemed: Concierge slot',
}
