import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { createCar } from '../lib/cars'

const CAR_TYPES = ['Saloon', 'SUV', 'Pickup', 'Van', 'Hatchback', 'Coupe']

export function AddCarScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const userCars = useAppStore((s) => s.userCars)
  const setUserCars = useAppStore((s) => s.setUserCars)
  const showToast = useAppStore((s) => s.showToast)

  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [colour, setColour] = useState('')
  const [plate, setPlate] = useState('')
  const [carType, setCarType] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!make.trim() || !model.trim() || !plate.trim()) {
      setError('Make, model and plate are required.')
      return
    }
    const limit = currentUser?.sub_car_limit || 1
    if (userCars.length >= limit) {
      setError('Car limit reached for your plan. Upgrade to add more.')
      return
    }
    if (!currentUser) return

    setSaving(true)
    setError('')
    try {
      const car = await createCar({
        user_email: currentUser.email,
        make: make.trim(),
        model: model.trim(),
        colour: colour.trim(),
        plate: plate.trim().toUpperCase(),
        car_type: carType,
      })
      setUserCars([...userCars, car])
      showToast('Car added!')
      navigate('/profile')
    } catch (e) {
      setError(e instanceof Error ? `Error: ${e.message}` : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-bg">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-surface-1 px-4 py-4">
        <button
          onClick={() => navigate('/profile')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-navy hover:bg-bg"
        >
          ←
        </button>
        <h2 className="text-base font-bold text-navy">Add a Car</h2>
      </div>

      <div className="px-5 py-5">
        <Field label="Car Make (e.g. Toyota)">
          <input
            type="text"
            placeholder="Toyota"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-accent"
          />
        </Field>
        <Field label="Car Model (e.g. Vitz)">
          <input
            type="text"
            placeholder="Vitz"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-accent"
          />
        </Field>
        <Field label="Car Colour">
          <input
            type="text"
            placeholder="Silver"
            value={colour}
            onChange={(e) => setColour(e.target.value)}
            className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-accent"
          />
        </Field>
        <Field label="Number Plate">
          <input
            type="text"
            placeholder="KCA 123A"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3 text-sm uppercase text-navy outline-none focus:border-accent"
          />
        </Field>
        <Field label="Car Type">
          <select
            value={carType}
            onChange={(e) => setCarType(e.target.value)}
            className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-accent"
          >
            <option value="">Select type</option>
            {CAR_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        {error && <div className="mb-4 text-sm text-danger">{error}</div>}

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="w-full rounded-2xl bg-accent py-4 text-[15px] font-bold text-white shadow-app-md disabled:opacity-50"
        >
          {saving ? 'Please wait…' : 'Save Car'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-semibold text-navy">{label}</label>
      {children}
    </div>
  )
}
