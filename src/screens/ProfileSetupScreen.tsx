import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { updateProfile } from '../lib/auth'
import { V2Field, V2FieldError, V2Input } from '../components/v2/V2Form'


export function ProfileSetupScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)
  const showToast = useAppStore((s) => s.showToast)

  const [name, setName] = useState(currentUser?.name ?? '')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!phone.trim() || phone.trim().length < 9) { setError('Please enter a valid phone number.'); return }
    if (!currentUser) return
    setSaving(true); setError('')
    try {
      await updateProfile(currentUser.email, { name: name.trim(), phone: phone.trim() })
      setCurrentUser({ ...currentUser, name: name.trim(), phone: phone.trim() })
      showToast('Profile saved!'); navigate('/onboarding')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile.')
    } finally { setSaving(false) }
  }

  return (
    <div className="flex h-full flex-col" style={{ background: '#F5F5F7' }}>
      {/* Header */}
      <div className="px-5 pt-10 pb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0A1628 0%, #0A2A4A 100%)' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 150, height: 150, borderRadius: 75, background: '#0A84FF', opacity: 0.07, pointerEvents: 'none' }} />
        <div className="flex items-center gap-2.5 mb-4">
          <img src="/logo.png" alt="SplashPass" className="h-9 w-9 rounded-[11px]" />
          <div className="text-[16px] font-extrabold text-white" style={{ letterSpacing: '-0.3px' }}>SplashPass</div>
        </div>
        <div className="text-[22px] font-extrabold text-white mb-1" style={{ letterSpacing: '-0.5px' }}>Set up your profile</div>
        <div className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Just a few details to get started.</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-32">
        <div className="rounded-[18px] bg-white p-4" style={{ border: '1px solid #EBEBED' }}>
          <V2Field label="Full Name">
            <V2Input placeholder="Alex Mwangi" value={name} onChange={(e) => setName(e.target.value)} />
          </V2Field>
          <V2Field label="Phone Number (M-Pesa)">
            <V2Input type="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </V2Field>
          <V2FieldError>{error}</V2FieldError>
        </div>

        <div className="mt-3 rounded-[14px] p-3.5 flex items-center gap-3" style={{ background: '#E0FAF9' }}>
          <span className="text-lg flex-shrink-0">📱</span>
          <span className="text-[12px] font-medium" style={{ color: '#0A2820' }}>
            Your M-Pesa number is used for booking payments. You can change it later.
          </span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-6"
        style={{ background: 'rgba(245,245,247,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid #EBEBED' }}>
        <button onClick={handleSave} disabled={saving}
          className="sp-press w-full rounded-[16px] py-4 text-[15px] font-extrabold text-white"
          style={{ background: '#0A84FF', boxShadow: '0 8px 24px rgba(10,132,255,0.36)', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
