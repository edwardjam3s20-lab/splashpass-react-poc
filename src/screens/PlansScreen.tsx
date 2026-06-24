import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { SUB_PLANS } from '../lib/plans'
import { getTrialDaysLeft, isOnTrial } from '../lib/access'

const FEATURES_FOR = (carLimit: number) => [
  `${carLimit} car${carLimit > 1 ? 's' : ''} registered`,
  'Book at any SplashPass wash point',
  'No KSh 30 app fee per booking',
  'Auto-renews monthly via M-Pesa',
  'QR wash pass + SMS confirmation',
  'Loyalty points on every wash',
]

export function PlansScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const setSelectedSubPlan = useAppStore((s) => s.setSelectedSubPlan)

  const daysLeft = getTrialDaysLeft(currentUser)
  const onTrial = isOnTrial(currentUser)

  function handleSelectPlan(planId: string) {
    const plan = SUB_PLANS.find((p) => p.id === planId)
    if (!plan) return
    setSelectedSubPlan(plan)
    navigate('/mpesa/subscription')
  }

  return (
    <div className="bg-bg px-5 pt-6 pb-6">
      <h2 className="mb-1 text-[26px] font-extrabold text-navy">Choose your plan</h2>
      <p className="mb-5 text-sm text-muted">Monthly subscription · Auto-renews · Cancel anytime</p>

      {onTrial && (
        <div className="mb-5 flex items-center gap-3.5 rounded-2xl bg-gradient-to-br from-[#1A2755] to-[#2D1B6B] px-5 py-4.5 shadow-app-md">
          <div className="flex-shrink-0 text-3xl">🎁</div>
          <div className="flex-1">
            <div className="mb-0.5 text-[15px] font-extrabold text-white">Free Trial Active</div>
            <div className="text-xs leading-relaxed text-white/60">
              KSh 30 app fee per booking during trial. Subscribe to remove the fee.
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="font-display text-[28px] font-extrabold text-gold-2">{daysLeft}</div>
            <div className="text-[10px] text-white/50">days left</div>
          </div>
        </div>
      )}

      {SUB_PLANS.map((p) => {
        const isCurrentPlan = currentUser?.sub_plan === p.id && currentUser?.sub_status === 'active'
        return (
          <div
            key={p.id}
            className={[
              'relative mb-3.5 rounded-[22px] border-[1.5px] bg-white p-5.5 shadow-app',
              p.popular
                ? 'border-accent bg-gradient-to-b from-accent/[0.04] to-white shadow-[0_12px_40px_rgba(79,110,247,0.15)]'
                : 'border-slate-200',
            ].join(' ')}
          >
            {p.popular && (
              <div className="absolute -top-px right-5.5 rounded-b-xl bg-accent px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                Most Popular
              </div>
            )}

            <div className="mb-1 flex items-center gap-2.5">
              <div className="text-[28px]">{p.icon}</div>
              <div>
                <div className="text-lg font-extrabold text-navy">{p.name}</div>
                <div className="text-xs text-muted">
                  Up to {p.car_limit} car{p.car_limit > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className="mt-2 font-display text-[34px] font-extrabold text-accent">
              KSh {p.price}
              <span className="text-sm font-normal text-muted">/{p.billing}</span>
            </div>

            <ul className="my-3.5 list-none">
              {FEATURES_FOR(p.car_limit).map((f) => (
                <li key={f} className="flex items-center gap-2 py-1.5 text-sm text-muted">
                  <span className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] text-accent">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            {isCurrentPlan ? (
              <button
                disabled
                className="w-full rounded-xl border-[1.5px] border-slate-200 py-3.5 text-sm font-bold text-muted opacity-50"
              >
                Current Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectPlan(p.id)}
                className={[
                  'w-full rounded-xl py-3.5 text-sm font-bold',
                  p.popular ? 'bg-accent text-white shadow-app-md' : 'border-[1.5px] border-slate-200 text-navy',
                ].join(' ')}
              >
                Subscribe — KSh {p.price}/{p.billing}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
