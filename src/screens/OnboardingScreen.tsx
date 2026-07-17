import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardOption } from '../components/OnboardOption'
import { V2Input } from '../components/v2/V2Form'
import { SUB_PLANS } from '../lib/plans'
import { createCar, getCarsByEmail } from '../lib/cars'
import { updateProfile } from '../lib/auth'
import { useAppStore } from '../store/useAppStore'

const CAR_TYPE_OPTIONS = [
  { value: 'Saloon', icon: '🚗', title: 'Sedan / Saloon', subtitle: 'Regular passenger car' },
  { value: 'SUV', icon: '🚙', title: 'SUV / 4x4', subtitle: 'Sport utility or off-road' },
  { value: 'Pickup', icon: '🛻', title: 'Pickup / Van', subtitle: 'Commercial or utility vehicle' },
  { value: 'Hatchback', icon: '🚘', title: 'Hatchback / Coupe', subtitle: 'Compact car' },
]

export function OnboardingScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)
  const setUserCars = useAppStore((s) => s.setUserCars)
  const setSelectedSubPlan = useAppStore((s) => s.setSelectedSubPlan)
  const showToast = useAppStore((s) => s.showToast)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [carType, setCarType] = useState<string | null>(null)
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [colour, setColour] = useState('')
  const [plate, setPlate] = useState('')
  const [carError, setCarError] = useState('')
  const [planId, setPlanId] = useState<string | null>(null)
  const [planError, setPlanError] = useState('')
  const [finishing, setFinishing] = useState(false)

  function handleNext1() {
    if (!carType) { showToast('Please select a car type.', true); return }
    setStep(2)
  }

  function handleNext2() {
    if (!make.trim() || !model.trim() || !plate.trim()) { setCarError('Make, model and plate are required.'); return }
    setCarError(''); setStep(3)
  }

  async function handleFinish() {
    if (!planId) { setPlanError('Please choose a plan to continue.'); return }
    if (!currentUser) { setPlanError('Session expired. Please sign in again.'); return }
    const plan = SUB_PLANS.find((p) => p.id === planId)
    if (!plan) return
    setPlanError(''); setFinishing(true)
    try {
      await createCar({ user_email: currentUser.email, make: make.trim(), model: model.trim(), colour: colour.trim(), plate: plate.trim().toUpperCase(), car_type: carType ?? '' })
      await updateProfile(currentUser.email, { sub_plan: plan.id, sub_plan_name: plan.name, sub_car_limit: plan.car_limit, sub_status: 'trial' })
      setCurrentUser({ ...currentUser, sub_plan: plan.id, sub_plan_name: plan.name, sub_car_limit: plan.car_limit, sub_status: 'trial' })
      const cars = await getCarsByEmail(currentUser.email)
      setUserCars(cars); showToast('Welcome to SplashPass! 30-day trial starts now 🎉'); navigate('/home')
    } catch (e) {
      setPlanError(e instanceof Error ? `Error: ${e.message}` : 'Something went wrong.')
    } finally { setFinishing(false) }
  }

  async function handlePayNow() {
    if (!planId) { setPlanError('Please choose a plan to continue.'); return }
    if (!currentUser) { setPlanError('Session expired. Please sign in again.'); return }
    const plan = SUB_PLANS.find((p) => p.id === planId)
    if (!plan) return
    setPlanError(''); setFinishing(true)
    try {
      await createCar({ user_email: currentUser.email, make: make.trim(), model: model.trim(), colour: colour.trim(), plate: plate.trim().toUpperCase(), car_type: carType ?? '' })
      // Leave sub_status as 'pending' rather than 'trial' — the M-Pesa
      // callback (same one PlansScreen's Subscribe flow already uses)
      // flips it to 'active' once payment actually confirms.
      await updateProfile(currentUser.email, { sub_plan: plan.id, sub_plan_name: plan.name, sub_car_limit: plan.car_limit, sub_status: 'pending' })
      setCurrentUser({ ...currentUser, sub_plan: plan.id, sub_plan_name: plan.name, sub_car_limit: plan.car_limit, sub_status: 'pending' })
      const cars = await getCarsByEmail(currentUser.email)
      setUserCars(cars)
      setSelectedSubPlan(plan)
      navigate('/mpesa/subscription')
    } catch (e) {
      setPlanError(e instanceof Error ? `Error: ${e.message}` : 'Something went wrong.')
      setFinishing(false)
    }
  }

  const stepLabels = ['Vehicle Type', 'Car Details', 'Choose Plan']

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 pt-6 pb-8" style={{ background: '#F5F5F7' }}>
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {stepLabels.map((l, i) => {
          const n = i + 1
          const done = n < step, active = n === step
          return (
            <div key={l} style={{ display: 'flex', alignItems: 'center', flex: i < stepLabels.length - 1 ? 1 : 0 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 13, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
                background: done ? '#30D158' : active ? '#0A84FF' : '#EBEBED',
                color: done || active ? '#fff' : '#AEAEB2',
                transition: 'all 0.3s',
              }}>
                {done ? '✓' : n}
              </div>
              {i < stepLabels.length - 1 && (
                <div style={{ flex: 1, height: 2, margin: '0 4px', background: done ? '#0A84FF' : '#EBEBED', transition: 'background 0.4s' }} />
              )}
            </div>
          )
        })}
      </div>

      {step === 1 && (
        <div className="flex flex-1 flex-col sp-fade-up">
          <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-1">Step 1 of 3</div>
          <h2 className="text-[24px] font-extrabold text-ink mb-1.5" style={{ letterSpacing: '-0.5px' }}>What type of car?</h2>
          <p className="text-[13px] text-muted mb-6 leading-relaxed">Helps us show the right wash prices.</p>
          <div className="flex flex-1 flex-col gap-2.5">
            {CAR_TYPE_OPTIONS.map((opt) => (
              <OnboardOption key={opt.value} icon={opt.icon} title={opt.title} subtitle={opt.subtitle}
                selected={carType === opt.value} onClick={() => setCarType(opt.value)} />
            ))}
          </div>
          <button onClick={handleNext1}
            className="sp-press mt-6 w-full rounded-[16px] py-4 text-[15px] font-extrabold text-white"
            style={{ background: '#0A84FF', boxShadow: '0 8px 24px rgba(10,132,255,0.36)' }}>
            Continue →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col sp-fade-up">
          <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-1">Step 2 of 3</div>
          <h2 className="text-[24px] font-extrabold text-ink mb-1.5" style={{ letterSpacing: '-0.5px' }}>Your car details</h2>
          <p className="text-[13px] text-muted mb-6 leading-relaxed">We'll use this to identify your car at the wash point.</p>
          <div className="rounded-[18px] bg-white p-4 mb-3" style={{ border: '1px solid #EBEBED' }}>
            {[
              { label: 'Make (e.g. Toyota)', ph: 'Toyota', val: make, set: setMake },
              { label: 'Model (e.g. Vitz)', ph: 'Vitz', val: model, set: setModel },
              { label: 'Colour', ph: 'Silver', val: colour, set: setColour },
              { label: 'Number Plate', ph: 'KCA 123A', val: plate, set: (v: string) => setPlate(v.toUpperCase()), upper: true },
            ].map(({ label, ph, val, set, upper }) => (
              <div key={label} className="mb-4 last:mb-0">
                <label className="block text-[11px] font-bold text-muted uppercase tracking-[0.5px] mb-1.5">{label}</label>
                <V2Input placeholder={ph} value={val} onChange={(e) => (set as any)(e.target.value)} className={upper ? 'uppercase' : ''} />
              </div>
            ))}
          </div>
          {carError && <div className="text-[13px] mb-3" style={{ color: '#FF3B30' }}>{carError}</div>}
          <div className="flex gap-2.5 mt-2">
            <button onClick={() => setStep(1)}
              className="sp-press flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-[16px] text-xl text-ink"
              style={{ border: '1.5px solid #EBEBED', background: '#fff' }}>←</button>
            <button onClick={handleNext2}
              className="sp-press flex-1 rounded-[16px] py-4 text-[15px] font-extrabold text-white"
              style={{ background: '#0A84FF', boxShadow: '0 8px 24px rgba(10,132,255,0.36)' }}>
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-1 flex-col sp-fade-up">
          <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-1">Step 3 of 3</div>
          <h2 className="text-[24px] font-extrabold text-ink mb-1.5" style={{ letterSpacing: '-0.5px' }}>Choose your plan</h2>
          <p className="text-[13px] text-muted mb-6 leading-relaxed">30-day free trial starts now. You'll be charged after trial ends.</p>
          <div className="flex flex-1 flex-col gap-2.5">
            {SUB_PLANS.map((p) => (
              <OnboardOption key={p.id} icon={p.icon}
                title={`${p.name} — KSh ${p.price}/${p.billing === 'week' ? 'wk' : 'mo'}`}
                subtitle={`Up to ${p.car_limit} car${p.car_limit > 1 ? 's' : ''} · ${p.tagline}`}
                selected={planId === p.id} onClick={() => setPlanId(p.id)} />
            ))}
          </div>
          {planError && <div className="text-[13px] mt-2" style={{ color: '#FF3B30' }}>{planError}</div>}
          <div className="flex gap-2.5 mt-5">
            <button onClick={() => setStep(2)}
              className="sp-press flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-[16px] text-xl text-ink"
              style={{ border: '1.5px solid #EBEBED', background: '#fff' }}>←</button>
            <button onClick={handleFinish} disabled={finishing}
              className="sp-press flex-1 rounded-[16px] py-4 text-[15px] font-extrabold text-white"
              style={{ background: '#00C6BE', boxShadow: '0 8px 24px rgba(0,198,190,0.36)', opacity: finishing ? 0.6 : 1 }}>
              {finishing ? 'Please wait…' : 'Start Free Trial →'}
            </button>
          </div>
          <button onClick={handlePayNow} disabled={finishing}
            className="sp-press mt-2.5 w-full rounded-[16px] py-3.5 text-[14px] font-bold text-ink"
            style={{ background: '#fff', border: '1.5px solid #EBEBED', opacity: finishing ? 0.6 : 1 }}>
            {finishing ? 'Please wait…' : 'Pay Now via M-Pesa instead'}
          </button>
        </div>
      )}
    </div>
  )
}
