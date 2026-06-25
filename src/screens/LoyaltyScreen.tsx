import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { LOYALTY_TIERS, REDEEM_CATALOGUE, TIER_RANK, getTier } from '../lib/loyalty'
import {
  fetchLoyaltyStatus, fetchLoyaltyTransactions, redeemLoyaltyItem,
  LEDGER_REASON_LABELS, type LoyaltyStatus, type LoyaltyTransaction,
} from '../lib/loyaltyApi'

export function LoyaltyScreen() {
  const navigate = useNavigate()
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
      points: pts, tier, discount_addon: tierObj.discount_addon,
      discount_premium: tierObj.discount_premium,
      next_tier: nextTierObj?.name ?? null, next_tier_at: nextTierObj?.min ?? null,
      points_to_next: nextTierObj ? Math.max(0, nextTierObj.min - pts) : 0,
      active_redemptions: [],
    })
    fetchLoyaltyStatus().then((data) => { if (data) setStatus(data) })
  }, [currentUser])

  useEffect(() => {
    setLedgerError(false)
    fetchLoyaltyTransactions().then(setLedger).catch(() => setLedgerError(true))
  }, [])

  async function handleRedeem(type: string) {
    if (!status) return
    const item = REDEEM_CATALOGUE.find((i) => i.type === type)
    if (!item) return
    const result = await redeemLoyaltyItem(type)
    if (!result.ok) { showToast(result.error || 'Redemption failed', true); return }
    showToast(`✓ ${result.label} activated!`)
    setStatus({ ...status, points: result.pointsRemaining ?? status.points })
  }

  if (!status) return null

  const { points, tier, next_tier: nextTier, points_to_next: toNext, discount_addon: discAddon, discount_premium: discPrem } = status
  const tierObj = getTier(points)
  const nextAt = status.next_tier_at
  const pct = nextAt ? Math.min(100, Math.round((points / nextAt) * 100)) : 100
  const userRank = TIER_RANK[tier] ?? 0

  return (
    <div style={{ background: '#F5F5F7', minHeight: '100%', paddingBottom: 100 }}>
      {/* ── Rewards hero card ── */}
      <div
        className="relative overflow-hidden px-5 pt-5 pb-6"
        style={{ background: 'linear-gradient(160deg, #0A1628 0%, #1A0A3A 100%)' }}
      >
        {/* Glow orb */}
        <div style={{
          position: 'absolute', right: -50, top: -50,
          width: 200, height: 200, borderRadius: 100,
          background: '#FFD60A', opacity: 0.07, pointerEvents: 'none',
        }} />

        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate('/profile')}
            className="sp-press flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] text-base text-white"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            ←
          </button>
          <div className="text-[20px] font-extrabold text-white" style={{ letterSpacing: '-0.4px' }}>
            Your Rewards
          </div>
        </div>

        {/* Tier badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-3"
          style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}>
          <span>{tierObj.icon}</span>
          <span className="text-[12px] font-bold text-white uppercase tracking-wider">{tier}</span>
        </div>

        {/* Points display */}
        <div className="text-[52px] font-extrabold leading-none mb-1"
          style={{ color: '#FFD60A', letterSpacing: '-2px' }}>
          {points.toLocaleString()}
        </div>
        <div className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
          SplashPass Points
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden mb-2"
          style={{ background: 'rgba(255,255,255,0.09)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #FFD60A, #FF9500)' }} />
        </div>
        <div className="flex justify-between text-[11px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
          <span>{points.toLocaleString()} pts</span>
          <span>{nextTier ? `${toNext.toLocaleString()} pts to ${nextTier}` : 'Max tier reached 🎉'}</span>
        </div>

        {/* Active perks */}
        {(discAddon > 0 || discPrem > 0) && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: 'rgba(255,214,10,0.14)', border: '1px solid rgba(255,214,10,0.3)' }}>
            <span className="text-[12px]">🏷</span>
            <span className="text-[12px] font-bold" style={{ color: '#FFD60A' }}>
              {[discAddon > 0 ? `${discAddon}% off add-ons` : '', discPrem > 0 ? `${discPrem}% off premium` : ''].filter(Boolean).join(' · ')} — active
            </span>
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        {/* Redeem catalogue */}
        <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-3">
          Redeem Points
        </div>
        {REDEEM_CATALOGUE.map((item) => {
          const reqRank = item.tier ? TIER_RANK[item.tier] ?? 0 : 0
          const locked = userRank < reqRank
          const canAfford = points >= item.cost
          return (
            <div
              key={item.type}
              className="flex items-center gap-3 rounded-[16px] bg-white p-4 mb-2.5"
              style={{
                border: '1px solid #EBEBED',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                opacity: locked ? 0.5 : 1,
              }}
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[13px] text-xl"
                style={{ background: '#FFFBE6' }}>
                {item.type.includes('wash') ? '🚿' : item.type.includes('premium') ? '💎' : '🏷'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-ink mb-0.5">{item.label}</div>
                <div className="text-[12px] text-muted mb-1.5">{item.desc}</div>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: '#FFFBE6', color: '#A07800' }}>
                  ⭐ {item.cost} pts
                </span>
              </div>
              {locked ? (
                <div className="text-[11px] text-muted flex-shrink-0">🔒 {item.tier}</div>
              ) : (
                <button
                  onClick={() => handleRedeem(item.type)}
                  disabled={!canAfford}
                  className="sp-press flex-shrink-0 rounded-[11px] px-3 py-2 text-[12px] font-bold"
                  style={{
                    background: canAfford ? '#FFD60A' : '#F5F5F7',
                    color: canAfford ? '#0D0D0D' : '#AEAEB2',
                    border: canAfford ? 'none' : '1px solid #EBEBED',
                  }}
                >
                  {canAfford ? 'Redeem' : 'Not enough'}
                </button>
              )}
            </div>
          )
        })}

        {/* History */}
        <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-3 mt-5">
          Point History
        </div>
        <div className="rounded-[18px] bg-white overflow-hidden"
          style={{ border: '1px solid #EBEBED', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {ledgerError ? (
            <div className="py-5 text-center text-[13px]" style={{ color: '#FF3B30' }}>
              Could not load history.
            </div>
          ) : ledger === null ? (
            <div className="p-4">
              {[80, 60, 72].map((w, i) => (
                <div key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: i < 2 ? '1px solid #EBEBED' : 'none' }}>
                  <div className="sp-skeleton h-8 w-8 rounded-[10px] flex-shrink-0" />
                  <div className="flex-1">
                    <div className="sp-skeleton h-3.5 rounded mb-1.5" style={{ width: `${w}%` }} />
                    <div className="sp-skeleton h-2.5 rounded w-20" />
                  </div>
                  <div className="sp-skeleton h-4 w-14 rounded" />
                </div>
              ))}
            </div>
          ) : ledger.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-[14px] font-bold text-ink mb-1">No points yet</div>
              <div className="text-[12px] text-muted">Book a wash to start earning</div>
            </div>
          ) : (
            ledger.map((t, i) => {
              const isPos = t.delta > 0
              const label = LEDGER_REASON_LABELS[t.reason] || t.reason
              const date = new Date(t.created_at).toLocaleDateString('en-KE', {
                day: 'numeric', month: 'short', year: 'numeric',
              })
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < ledger.length - 1 ? '1px solid #EBEBED' : 'none' }}>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] text-sm"
                    style={{ background: isPos ? '#E8F9ED' : '#FFF0EE' }}>
                    {isPos ? '⬆' : '⬇'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-ink truncate">{label}</div>
                    <div className="text-[11px] text-muted mt-0.5">{date}</div>
                  </div>
                  <div className="text-[14px] font-extrabold flex-shrink-0"
                    style={{ color: isPos ? '#30D158' : '#FF3B30' }}>
                    {isPos ? '+' : ''}{t.delta} pts
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
