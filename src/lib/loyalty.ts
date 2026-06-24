export interface LoyaltyTier {
  name: string
  min: number
  max: number
  icon: string
  discount_addon: number
  discount_premium: number
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  { name: 'Bronze', min: 0, max: 499, icon: '🥉', discount_addon: 0, discount_premium: 0 },
  { name: 'Silver', min: 500, max: 1499, icon: '🥈', discount_addon: 5, discount_premium: 0 },
  { name: 'Gold', min: 1500, max: 3999, icon: '🥇', discount_addon: 10, discount_premium: 10 },
  { name: 'Platinum', min: 4000, max: 999999, icon: '💎', discount_addon: 15, discount_premium: 15 },
]

export function getTier(points: number): LoyaltyTier {
  return LOYALTY_TIERS.find((t) => points >= t.min && points <= t.max) ?? LOYALTY_TIERS[0]
}

export const TIER_RANK: Record<string, number> = { Bronze: 0, Silver: 1, Gold: 2, Platinum: 3 }

export interface RedeemCatalogueItem {
  type: string
  label: string
  cost: number
  tier: string | null
  desc: string
}

export const REDEEM_CATALOGUE: RedeemCatalogueItem[] = [
  {
    type: 'priority_slot',
    label: 'Priority slot — single booking',
    cost: 150,
    tier: null,
    desc: 'Jump the queue on one booking. Valid 14 days from issue.',
  },
  {
    type: 'priority_month',
    label: 'Priority queue — 30 days',
    cost: 400,
    tier: 'Silver',
    desc: 'Your bookings get priority placement at all wash points for a full month.',
  },
  {
    type: 'cancellation_window',
    label: 'Extended cancellation window',
    cost: 300,
    tier: null,
    desc: 'Unlock a 48-hour cancellation window on your next 3 bookings.',
  },
  {
    type: 'early_access',
    label: 'Early access — 7 days',
    cost: 500,
    tier: 'Silver',
    desc: 'Book new slots 7 days before general public. Valid 30 days.',
  },
  {
    type: 'partner_voucher',
    label: 'Partner voucher',
    cost: 800,
    tier: 'Gold',
    desc: 'A voucher from a SplashPass partner — tyre, detailing, or fuel.',
  },
  {
    type: 'platinum_concierge',
    label: 'Platinum early access + concierge',
    cost: 1200,
    tier: 'Platinum',
    desc: '14-day early booking + one dedicated concierge-scheduled wash.',
  },
]
