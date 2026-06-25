import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { createCar, getCarsByEmail } from '../lib/cars'
import { V2Field, V2FieldError, V2Input } from '../components/v2/V2Form'

const CAR_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Pickup', 'Van/Minibus', 'Truck']
const CAR_TYPE_ICONS: Record<string, string> = { Sedan: '🚗', SUV: '🚙', Hatchback: '🚘', Pickup: '🛻', 'Van/Minibus': '🚐', Truck: '🚚' }

export function AddCarScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const setUserCars = useAppStore((s) => s.setUserCars)
  const showToast = useAppStore((s) => s.showToast)

  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [colour, setColour] = useState('')
  const [plate, setPlate] = useState('')
  const [carType, setCarType] = useState(CAR_TYPES[0])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!make.trim() || !model.trim() || !plate.trim()) { setError('Make, model and plate are required.'); return }
    if (!currentUser) return
    setSaving(true); setError('')
    try {
      await createCar({ user_email: currentUser.email, make: make.trim(), model: model.trim(), colour: colour.trim(), plate: plate.trim().toUpperCase(), car_type: carType })
      const cars = await getCarsByEmail(currentUser.email)
      setUserCars(cars); showToast('Vehicle added!'); navigate('/profile')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save vehicle.')
    } finally { setSaving(false) }
  }

  return (
    <div className="flex h-full flex-col" style={{ background: '#F5F5F7' }}>
      <div className="flex items-center gap-3 bg-white px-4 py-4" style={{ boxShadow: '0 1px 0 #EBEBED' }}>
        <button onClick={() => navigate(-1)} className="sp-press flex h-9 w-9 items-center justify-center rounded-[11px] text-lg text-ink" style={{ background: '#F5F5F7' }}>←</button>
        <div className="text-[16px] font-extrabold text-ink" style={{ letterSpacing: '-0.3px' }}>Add Vehicle</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-32">
        {/* Car type selector */}
        <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-3">Vehicle Type</div>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {CAR_TYPES.map((t) => (
            <div key={t} onClick={() => setCarType(t)}
              className="sp-press cursor-pointer rounded-[13px] py-3 text-center"
              style={{ background: carType === t ? 'rgba(10,132,255,0.08)' : '#fff', border: `1.5px solid ${carType === t ? '#0A84FF' : '#EBEBED'}` }}>
              <div className="text-xl mb-1">{CAR_TYPE_ICONS[t]}</div>
              <div className="text-[11px] font-bold" style={{ color: carType === t ? '#0A84FF' : '#0D0D0D' }}>{t}</div>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="rounded-[18px] bg-white p-4 mb-3" style={{ border: '1px solid #EBEBED' }}>
          <V2Field label="Make (e.g. Toyota)">
            <V2Input placeholder="Toyota" value={make} onChange={(e) => setMake(e.target.value)} />
          </V2Field>
          <V2Field label="Model (e.g. Vitz)">
            <V2Input placeholder="Vitz" value={model} onChange={(e) => setModel(e.target.value)} />
          </V2Field>
          <V2Field label="Colour">
            <V2Input placeholder="Silver" value={colour} onChange={(e) => setColour(e.target.value)} />
          </V2Field>
          <V2Field label="Number Plate">
            <V2Input placeholder="KCA 123A" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} className="uppercase" />
          </V2Field>
          <V2FieldError>{error}</V2FieldError>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-6" style={{ background: 'rgba(245,245,247,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid #EBEBED' }}>
        <button onClick={handleSave} disabled={saving}
          className="sp-press w-full rounded-[16px] py-4 text-[15px] font-extrabold text-white"
          style={{ background: '#0A84FF', boxShadow: '0 8px 24px rgba(10,132,255,0.36)', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Add Vehicle →'}
        </button>
      </div>
    </div>
  )
}
