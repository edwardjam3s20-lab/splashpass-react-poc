import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { V2Screen, V2Logo } from '../components/v2/V2Layout'
import { V2Button } from '../components/v2/V2Button'
import { V2Field, V2FieldError, V2Input, V2Select } from '../components/v2/V2Form'
import { useAppStore } from '../store/useAppStore'
import { updateProfile } from '../lib/auth'

const CAR_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Pickup', 'Van/Minibus', 'Truck']

export function ProfileSetupScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)
  const showToast = useAppStore((s) => s.showToast)

  const [name, setName] = useState(currentUser?.name ?? '')
  const [phone, setPhone] = useState(currentUser?.phone ?? '')
  const [carType, setCarType] = useState(CAR_TYPES[0])
  const [plate, setPlate] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!phone.trim() || phone.trim().length < 9) {
      setError('Please enter a valid phone number.')
      return
    }
    if (!plate.trim()) {
      setError('Please enter your car\u2019s number plate.')
      return
    }
    if (!currentUser) {
      setError('Session expired. Please sign in again.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await updateProfile(currentUser.email, { name: name.trim(), phone: phone.trim() })
      setCurrentUser({ ...currentUser, name: name.trim(), phone: phone.trim() })

      // Car creation is handled by the onboarding flow (next screen), which
      // is where the original app's startOnboarding() picks up — this
      // screen's job is just the profile fields per the original split.
      showToast('Profile saved.')
      navigate('/onboarding') // placeholder route until onboarding flow is ported
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <V2Screen>
      <V2Logo />

      <div className="v2-fade-up d1">
        <h1 className="mb-2 text-[26px] font-extrabold leading-tight tracking-tight">
          Tell us about you
        </h1>
        <p className="mb-7 text-base leading-relaxed text-v2-text2">
          This helps wash operators recognize you and your car.
        </p>
      </div>

      <div className="v2-fade-up d2">
        <V2Field label="Full Name">
          <V2Input
            placeholder="e.g. Edward James"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </V2Field>

        <V2Field label="Phone Number">
          <V2Input
            type="tel"
            placeholder="07XX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </V2Field>

        <div className="my-5.5 flex items-center gap-3 text-[13px] font-medium text-v2-text2">
          <div className="h-px flex-1 bg-v2-border" />
          your car
          <div className="h-px flex-1 bg-v2-border" />
        </div>

        <V2Field label="Car Type">
          <V2Select value={carType} onChange={(e) => setCarType(e.target.value)}>
            {CAR_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </V2Select>
        </V2Field>

        <V2Field label="Number Plate">
          <V2Input
            placeholder="e.g. KDA 123A"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            autoCapitalize="characters"
          />
        </V2Field>

        <V2FieldError>{error}</V2FieldError>

        <div className="mt-1.5">
          <V2Button loading={saving} onClick={handleSave}>
            Continue →
          </V2Button>
        </div>
      </div>
    </V2Screen>
  )
}
