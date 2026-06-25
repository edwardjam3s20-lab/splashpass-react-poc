import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { changePassword, AuthError } from '../lib/auth'
import { V2Field, V2FieldError, V2PasswordInput } from '../components/v2/V2Form'
import { PasswordChecklist, isPasswordValid } from '../components/v2/PasswordChecklist'

export function ChangePasswordScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const showToast = useAppStore((s) => s.showToast)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!current || !next || !confirm) { setError('Please fill in all fields.'); return }
    if (!isPasswordValid(next)) { setError('New password must meet all requirements.'); return }
    if (next !== confirm) { setError('Passwords do not match.'); return }
    if (!currentUser) return
    setSaving(true); setError('')
    try {
      await changePassword(currentUser.email, current, next)
      showToast('Password updated!'); navigate('/profile')
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Could not change password.')
    } finally { setSaving(false) }
  }

  return (
    <div className="flex h-full flex-col" style={{ background: '#F5F5F7' }}>
      <div className="flex items-center gap-3 bg-white px-4 py-4" style={{ boxShadow: '0 1px 0 #EBEBED' }}>
        <button onClick={() => navigate(-1)} className="sp-press flex h-9 w-9 items-center justify-center rounded-[11px] text-lg text-ink" style={{ background: '#F5F5F7' }}>←</button>
        <div className="text-[16px] font-extrabold text-ink" style={{ letterSpacing: '-0.3px' }}>Change Password</div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-32">
        <div className="rounded-[18px] bg-white p-4" style={{ border: '1px solid #EBEBED' }}>
          <V2Field label="Current Password">
            <V2PasswordInput placeholder="Enter current password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </V2Field>
          <V2Field label="New Password">
            <V2PasswordInput placeholder="Create new password" value={next} onChange={(e) => setNext(e.target.value)} />
          </V2Field>
          <PasswordChecklist password={next} />
          <V2Field label="Confirm New Password">
            <V2PasswordInput placeholder="Repeat new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </V2Field>
          <V2FieldError>{error}</V2FieldError>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-6" style={{ background: 'rgba(245,245,247,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid #EBEBED' }}>
        <button onClick={handleSave} disabled={saving}
          className="sp-press w-full rounded-[16px] py-4 text-[15px] font-extrabold text-white"
          style={{ background: '#0A84FF', boxShadow: '0 8px 24px rgba(10,132,255,0.36)', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}
