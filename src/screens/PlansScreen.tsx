import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { SUB_PLANS } from '../lib/plans'
import { getTrialDaysLeft, isOnTrial } from '../lib/access'

const PLAN_COLORS: Record<string, string> = {
  mini: '#6E6E73',
  individual: '#0A84FF',
  duo: '#00C6BE',
  family: '#8B5CF6',
}

const PLAN_FEATURES = (carLimit: number) => [
  `Up to ${carLimit} car${carLimit > 1 ? 's' : ''} covered`,
  'Unlimited washes at any SplashPass point',
  'No KSh 30 app fee per booking',
  'QR wash pass + SMS confirmation',
  'Loyalty points on every wash',
  'Auto-renews via M-Pesa',
]

export function PlansScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const setSelectedSubPlan = useAppStore((s) => s.setSelectedSubPlan)

  const daysLeft = getTrialDaysLeft(currentUser)
  const onTrial = isOnTrial(currentUser)
  const [selPlanId, setSelPlanId] = useState(SUB_PLANS.find(p => p.popular)?.id || 'duo')

  const activePlan = SUB_PLANS.find(p => p.id === selPlanId) || SUB_PLANS[2]
  const col = PLAN_COLORS[activePlan.id] || '#0A84FF'
  const isCurrentPlan = currentUser?.sub_plan === activePlan.id && currentUser?.sub_status === 'active'

  function handleSelectPlan(planId: string) {
    const plan = SUB_PLANS.find((p) => p.id === planId)
    if (!plan) return
    setSelectedSubPlan(plan)
    navigate('/mpesa/subscription')
  }

  return (
    <div style={{ background: '#F5F5F7', minHeight: '100%', paddingBottom: 100 }}>
      <div className="bg-white px-5 pt-4 pb-5" style={{ boxShadow: '0 1px 0 #EBEBED' }}>
        <button
          onClick={() => navigate('/profile')}
          className="sp-press flex h-8 w-8 items-center justify-center rounded-[10px] text-base text-ink mb-3"
          style={{ background: '#F5F5F7' }}
        >
          ←
        </button>
        <div className="text-[22px] font-extrabold text-ink mb-1" style={{ letterSpacing: '-0.5px' }}>
          Choose Your Plan
        </div>
        <div className="text-[13px] text-muted">Cancel anytime · Auto-renews via M-Pesa</div>
        {onTrial && (
          <div className="mt-4 flex items-center gap-3 rounded-[16px] p-4"
            style={{ background: 'linear-gradient(135deg, #1C2E4A, #0A1628)' }}>
            <span className="text-2xl flex-shrink-0">🎁</span>
            <div className="flex-1">
              <div className="text-[14px] font-bold text-white mb-0.5">Free Trial Active</div>
              <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                KSh 30 app fee per booking during trial.
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[22px] font-extrabold" style={{ color: '#FFD60A', letterSpacing: '-0.5px' }}>{daysLeft}</div>
              <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>days left</div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        {/* Plan pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {SUB_PLANS.map((p) => {
            const pCol = PLAN_COLORS[p.id]
            const isActive = selPlanId === p.id
            return (
              <div key={p.id} onClick={() => setSelPlanId(p.id)}
                className="sp-press cursor-pointer flex-shrink-0 relative rounded-[15px] px-3 py-3 text-center"
                style={{ width: 78, background: isActive ? pCol : '#fff', border: `2px solid ${isActive ? pCol : '#EBEBED'}`, transition: 'all 0.2s' }}>
                {p.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#FFD60A', color: '#0D0D0D', whiteSpace: 'nowrap' }}>
                    POPULAR
                  </div>
                )}
                <div className="text-xl mb-1">{p.icon}</div>
                <div className="text-[11px] font-bold" style={{ color: isActive ? '#fff' : '#0D0D0D' }}>{p.name}</div>
                <div className="text-[9px]" style={{ color: isActive ? 'rgba(255,255,255,0.6)' : '#6E6E73' }}>
                  {p.car_limit} car{p.car_limit > 1 ? 's' : ''}
                </div>
              </div>
            )
          })}
        </div>

        {/* Active plan detail */}
        <div className="rounded-[20px] bg-white p-5 mb-3"
          style={{ border: '1px solid #EBEBED', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] text-2xl"
                style={{ background: col + '18' }}>
                {activePlan.icon}
              </div>
              <div>
                <div className="text-[18px] font-extrabold text-ink">{activePlan.name} Plan</div>
                <div className="text-[12px] text-muted">{activePlan.tagline}</div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <div className="text-[24px] font-extrabold leading-none" style={{ color: col, letterSpacing: '-0.5px' }}>
                KSh {activePlan.price}
              </div>
              <div className="text-[12px] text-muted mt-0.5">/{activePlan.billing === 'week' ? 'week' : 'month'}</div>
            </div>
          </div>
          <div style={{ height: 1, background: '#EBEBED', margin: '0 0 14px' }} />
          {PLAN_FEATURES(activePlan.car_limit).map((f) => (
            <div key={f} className="flex items-center gap-2.5 py-1.5">
              <div className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: '#30D158' }}>✓</div>
              <span className="text-[13px] text-muted">{f}</span>
            </div>
          ))}
          <div className="mt-5">
            {isCurrentPlan ? (
              <div className="w-full rounded-[14px] py-4 text-center text-[14px] font-bold text-muted"
                style={{ background: '#F5F5F7', border: '1.5px solid #EBEBED' }}>
                ✓ Your Current Plan
              </div>
            ) : (
              <button onClick={() => handleSelectPlan(activePlan.id)}
                className="sp-press w-full rounded-[14px] py-4 text-[15px] font-extrabold text-white"
                style={{ background: col, boxShadow: `0 8px 24px ${col}40`, letterSpacing: '-0.2px' }}>
                Subscribe — KSh {activePlan.price}/{activePlan.billing === 'week' ? 'wk' : 'mo'}
              </button>
            )}
          </div>
        </div>
        <div className="text-center text-[12px] text-muted mt-2">
          Secure payment via M-Pesa · No contract
        </div>
      </div>
    </div>
  )
}
