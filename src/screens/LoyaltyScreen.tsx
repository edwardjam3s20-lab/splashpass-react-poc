import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { LOYALTY_TIERS, REDEEM_CATALOGUE, TIER_RANK, getTier } from '../lib/loyalty'
import {
  fetchLoyaltyStatus,
  fetchLoyaltyTransactions,
  redeemLoyaltyItem,
  LEDGER_REASON_LABELS,
  type LoyaltyStatus,
  type LoyaltyTransaction,
} from '../lib/loyaltyApi'

export function LoyaltyScreen() {
  const currentUser = useAppStore((s) => s.currentUser)
  const showToast = useAppStore((s) => s.showToast)

  const [status, setStatus] = useState<LoyaltyStatus | null>(null)
  const [ledger, setLedger] = useState<LoyaltyTransaction[] | null>(null)
  const [ledgerError, setLedgerError] = useState(false)

  useEffect(() => {
    if (!currentUser) return

    const pts = currentUser.loyalty_points || 0
    const tier = currentUser.loyalty_tier || 'Bronze'
    const tierObj = getTier(pts)
    const nextTierObj = LOYALTY_TIERS[LOYALTY_TIERS.indexOf(tierObj) + 1] ?? null

    setStatus({
      points: pts,
      tier,
      discount_addon: tierObj.discount_addon,
      discount_premium: tierObj.discount_premium,
      next_tier: nextTierObj?.name ?? null,
      next_tier_at: nextTierObj?.min ?? null,
      points_to_next: nextTierObj ? Math.max(0, nextTierObj.min - pts) : 0,
      active_redemptions: [],
    })

    fetchLoyaltyStatus().then((data) => {
      if (data) setStatus(data)
    })
  }, [currentUser])

  useEffect(() => {
    setLedgerError(false)
    fetchLoyaltyTransactions()
      .then(setLedger)
      .catch(() => setLedgerError(true))
  }, [])

  async function handleRedeem(type: string) {
    if (!status) return
    const item = REDEEM_CATALOGUE.find((i) => i.type === type)
    if (!item) return

    const result = await redeemLoyaltyItem(type)
    if (!result.ok) {
      showToast(result.error || 'Redemption failed', true)
      return
    }
    showToast(`✓ ${result.label} activated!`)
    setStatus({ ...status, points: result.pointsRemaining ?? status.points })
  }

  if (!status) return null

  const points = status.points
  const tier = status.tier
  const nextTier = status.next_tier
  const toNext = status.points_to_next
  const discAddon = status.discount_addon
  const discPrem = status.discount_premium
  const tierObj = getTier(points)
  const nextAt = status.next_tier_at
  const pct = nextAt ? Math.min(100, Math.round((points / nextAt) * 100)) : 100
  const userRank = TIER_RANK[tier] ?? 0

  return (
    <div className="bg-bg px-4.5 pt-6 pb-6">
      <h2 className="mb-5 text-xl font-bold text-navy">Rewards</h2>

      <div className="relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A2755] via-[#0B1437] to-[#2D1B6B] p-6 shadow-app-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-[180px] w-[180px] rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.15)_0%,transparent_70%)]" />

        <div className="relative mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
          <span>{tierObj.icon}</span>
          <span>{tier}</span>
        </div>

        <div className="relative mb-1 font-display text-[52px] font-extrabold leading-none text-gold-2">
          {points.toLocaleString()}
        </div>
        <div className="relative mb-4 text-[13px] text-white/55">SplashPass Points</div>

        <div className="relative mb-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-2 to-gold transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="relative flex justify-between text-[11px] text-white/45">
          <span>{points.toLocaleString()} pts</span>
          <span>{nextTier ? `${toNext.toLocaleString()} pts to ${nextTier}` : 'Max tier reached 🎉'}</span>
        </div>

        {(discAddon > 0 || discPrem > 0) && (
          <div className="relative mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/15 px-3.5 py-1.5 text-xs font-bold text-gold-2">
            <span>🏷</span>
            <span>
              {[discAddon > 0 ? `${discAddon}% off add-ons` : '', discPrem > 0 ? `${discPrem}% off premium services` : '']
                .filter(Boolean)
                .join(' · ')}{' '}
              — active
            </span>
          </div>
        )}
      </div>

      <div className="mb-2.5 mt-5 text-[11px] font-bold uppercase tracking-wide text-muted">
        Redeem Points — Access &amp; Privileges
      </div>
      {REDEEM_CATALOGUE.map((item) => {
        const reqRank = item.tier ? TIER_RANK[item.tier] ?? 0 : 0
        const locked = userRank < reqRank
        const canAfford = points >= item.cost

        return (
          <div
            key={item.type}
            className="mb-2.5 rounded-2xl border-[1.5px] border-slate-200 bg-white px-4.5 py-4 shadow-app"
            style={{ opacity: locked ? 0.5 : 1 }}
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="text-sm font-bold text-navy">{item.label}</div>
              <div className="font-display text-[13px] font-extrabold text-gold">{item.cost} pts</div>
            </div>
            <div className="mb-2.5 text-xs leading-relaxed text-muted">{item.desc}</div>
            {locked ? (
              <div className="flex items-center gap-1 text-[11px] text-muted-2">
                🔒 Requires {item.tier} tier
              </div>
            ) : (
              <button
                type="button"
                disabled={!canAfford}
                onClick={() => handleRedeem(item.type)}
                className={[
                  'rounded-lg px-4 py-2 text-xs font-bold',
                  canAfford ? 'bg-gold text-white active:scale-[0.97]' : 'border border-slate-200 text-muted',
                ].join(' ')}
              >
                {canAfford ? 'Redeem' : 'Not enough points'}
              </button>
            )}
          </div>
        )
      })}

      <div className="mb-2.5 mt-5 text-[11px] font-bold uppercase tracking-wide text-muted">
        Point History
      </div>
      <div className="rounded-2xl border-[1.5px] border-slate-200 bg-white px-4.5 shadow-app">
        {ledgerError ? (
          <div className="py-5 text-center text-[13px] text-danger">Could not load history.</div>
        ) : ledger === null ? (
          <div className="py-5 text-center text-[13px] text-muted">Loading...</div>
        ) : ledger.length === 0 ? (
          <div className="py-5 text-center text-[13px] text-muted">No transactions yet</div>
        ) : (
          ledger.map((t, i) => {
            const isPos = t.delta > 0
            const label = LEDGER_REASON_LABELS[t.reason] || t.reason
            const date = new Date(t.created_at).toLocaleDateString('en-KE', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
            return (
              <div
                key={i}
                className="flex items-center justify-between border-b border-surface-2 py-3 last:border-0"
              >
                <div>
                  <div className="text-[13px] font-medium text-navy">{label}</div>
                  <div className="mt-0.5 text-[11px] text-muted">{date}</div>
                </div>
                <div
                  className={[
                    'font-display text-sm font-extrabold',
                    isPos ? 'text-success' : 'text-danger',
                  ].join(' ')}
                >
                  {isPos ? '+' : ''}
                  {t.delta} pts
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
