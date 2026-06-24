import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { changePassword as changePasswordRpc, AuthError } from '../lib/auth'

function strengthOf(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: '', color: '' }
  let score = 0
  if (pass.length >= 8) score++
  if (/[0-9]/.test(pass)) score++
  if (/[^A-Za-z0-9]/.test(pass)) score++
  if (pass.length >= 12) score++
  const labels = ['Very weak', 'Weak', 'Okay', 'Good', 'Strong']
  const colors = ['#F04438', '#F5A623', '#F5A623', '#12B76A', '#12B76A']
  return { score, label: labels[score], color: colors[score] }
}

export function ChangePasswordScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const showToast = useAppStore((s) => s.showToast)

  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const strength = strengthOf(newPass)

  async function handleSubmit() {
    setError('')
    setSuccess(false)

    if (!current) return setError('Please enter your current password.')
    if (!newPass) return setError('Please enter a new password.')
    if (newPass.length < 8) return setError('New password must be at least 8 characters.')
    if (newPass !== confirm) return setError('Passwords do not match.')
    if (current === newPass) return setError('New password must be different from current password.')
    if (!currentUser) return

    setSaving(true)
    try {
      const ok = await changePasswordRpc(currentUser.email, current, newPass)
      if (!ok) {
        setError('Current password is incorrect.')
        return
      }
      setSuccess(true)
      setCurrent('')
      setNewPass('')
      setConfirm('')
      showToast('Password updated successfully!')
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Error updating password.')
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
        <h2 className="text-base font-bold text-navy">Change Password</h2>
      </div>

      <div className="px-6 py-6">
        <div className="mb-6 flex items-center gap-3.5 rounded-2xl bg-gradient-to-br from-navy-2 to-navy px-5 py-5">
          <div className="flex-shrink-0 text-3xl">🔒</div>
          <div>
            <div className="mb-0.5 text-sm font-bold text-white">Secure your account</div>
            <div className="text-xs leading-relaxed text-white/55">
              Use a strong password with at least 8 characters. You will remain signed in after
              changing.
            </div>
          </div>
        </div>

        <Field label="Current Password">
          <input
            type="password"
            placeholder="Enter current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3.5 text-sm text-navy outline-none focus:border-accent"
          />
        </Field>
        <Field label="New Password">
          <input
            type="password"
            placeholder="At least 8 characters"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3.5 text-sm text-navy outline-none focus:border-accent"
          />
        </Field>
        <Field label="Confirm New Password">
          <input
            type="password"
            placeholder="Repeat new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3.5 text-sm text-navy outline-none focus:border-accent"
          />
        </Field>

        {newPass && (
          <div className="mb-4">
            <div className="mb-1.5 flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{ backgroundColor: i < strength.score ? strength.color : '#E2E8F0' }}
                />
              ))}
            </div>
            <div className="text-xs text-muted">{strength.label}</div>
          </div>
        )}

        {error && <div className="mb-3 text-sm text-danger">{error}</div>}
        {success && (
          <div className="mb-4 rounded-2xl border border-success/20 bg-success/10 py-3.5 text-center text-sm text-success">
            ✓ Password changed successfully!
          </div>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={handleSubmit}
          className="w-full rounded-2xl bg-accent py-4 text-[15px] font-bold text-white shadow-app-md disabled:opacity-50"
        >
          {saving ? 'Please wait…' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-semibold text-muted">{label}</label>
      {children}
    </div>
  )
}
