import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardOption, OnboardProgress } from '../components/OnboardOption'
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
    if (!carType) {
      showToast('Please select a car type.', true)
      return
    }
    setStep(2)
  }

  function handleNext2() {
    if (!make.trim() || !model.trim() || !plate.trim()) {
      setCarError('Make, model and plate are required.')
      return
    }
    setCarError('')
    setStep(3)
  }

  async function handleFinish() {
    if (!planId) {
      setPlanError('Please choose a plan to continue.')
      return
    }
    if (!currentUser) {
      setPlanError('Session expired. Please sign in again.')
      return
    }
    const plan = SUB_PLANS.find((p) => p.id === planId)
    if (!plan) return

    setPlanError('')
    setFinishing(true)
    try {
      await createCar({
        user_email: currentUser.email,
        make: make.trim(),
        model: model.trim(),
        colour: colour.trim(),
        plate: plate.trim().toUpperCase(),
        car_type: carType ?? '',
      })

      await updateProfile(currentUser.email, {
        sub_plan: plan.id,
        sub_plan_name: plan.name,
        sub_car_limit: plan.car_limit,
        sub_status: 'trial',
      })

      setCurrentUser({
        ...currentUser,
        sub_plan: plan.id,
        sub_plan_name: plan.name,
        sub_car_limit: plan.car_limit,
        sub_status: 'trial',
      })

      const cars = await getCarsByEmail(currentUser.email)
      setUserCars(cars)

      showToast('Welcome to SplashPass! 30-day trial starts now 🎉')
      navigate('/home')
    } catch (e) {
      setPlanError(e instanceof Error ? `Error: ${e.message}` : 'Something went wrong.')
    } finally {
      setFinishing(false)
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-bg px-[22px] py-[54px]">
      <OnboardProgress step={step} />

      {step === 1 && (
        <div className="flex flex-1 flex-col">
          <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Step 1 of 3
          </div>
          <h2 className="mb-2 text-[25px] font-extrabold leading-tight text-navy">
            What type of car do you drive?
          </h2>
          <p className="mb-7 text-sm leading-relaxed text-muted">
            This helps show the right wash prices at each point.
          </p>

          <div className="flex flex-1 flex-col gap-2.5">
            {CAR_TYPE_OPTIONS.map((opt) => (
              <OnboardOption
                key={opt.value}
                icon={opt.icon}
                title={opt.title}
                subtitle={opt.subtitle}
                selected={carType === opt.value}
                onClick={() => setCarType(opt.value)}
              />
            ))}
          </div>

          <div className="mt-5.5 flex gap-2.5">
            <button
              type="button"
              onClick={handleNext1}
              className="flex-1 rounded-2xl bg-accent py-4 text-[15px] font-bold text-white shadow-app-md active:scale-[0.97]"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col">
          <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Step 2 of 3
          </div>
          <h2 className="mb-2 text-[25px] font-extrabold leading-tight text-navy">Your car details</h2>
          <p className="mb-7 text-sm leading-relaxed text-muted">
            We'll use this to identify your car at the wash point.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy">
                Make (e.g. Toyota)
              </label>
              <V2Input placeholder="Toyota" value={make} onChange={(e) => setMake(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy">
                Model (e.g. Vitz)
              </label>
              <V2Input placeholder="Vitz" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy">Colour</label>
              <V2Input
                placeholder="Silver"
                value={colour}
                onChange={(e) => setColour(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy">Number plate</label>
              <V2Input
                placeholder="KCA 123A"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                className="uppercase"
              />
            </div>
          </div>

          {carError && <div className="mt-2 text-sm text-danger">{carError}</div>}

          <div className="mt-5.5 flex gap-2.5">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-slate-200 bg-white text-xl text-navy shadow-app"
            >
              ←
            </button>
            <button
              type="button"
              onClick={handleNext2}
              className="flex-1 rounded-2xl bg-accent py-4 text-[15px] font-bold text-white shadow-app-md active:scale-[0.97]"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-1 flex-col">
          <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Step 3 of 3 · Choose your plan
          </div>
          <h2 className="mb-2 text-[25px] font-extrabold leading-tight text-navy">
            How many cars do you need?
          </h2>
          <p className="mb-7 text-sm leading-relaxed text-muted">
            Your 30-day free trial starts now. You'll be charged after the trial ends.
          </p>

          <div className="flex flex-1 flex-col gap-2.5">
            {SUB_PLANS.map((p) => (
              <OnboardOption
                key={p.id}
                icon={p.icon}
                title={`${p.name} — KSh ${p.price}/${p.billing === 'week' ? 'wk' : 'mo'}`}
                subtitle={`Up to ${p.car_limit} car${p.car_limit > 1 ? 's' : ''} · ${p.tagline}`}
                selected={planId === p.id}
                onClick={() => setPlanId(p.id)}
              />
            ))}
          </div>

          {planError && <div className="mt-2 text-sm text-danger">{planError}</div>}

          <div className="mt-5.5 flex gap-2.5">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-slate-200 bg-white text-xl text-navy shadow-app"
            >
              ←
            </button>
            <button
              type="button"
              disabled={finishing}
              onClick={handleFinish}
              className="flex-1 rounded-2xl bg-accent py-4 text-[15px] font-bold text-white shadow-app-md disabled:opacity-50 active:scale-[0.97]"
            >
              {finishing ? 'Please wait…' : 'Start Free Trial →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
