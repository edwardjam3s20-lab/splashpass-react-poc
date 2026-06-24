import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { verifyPasswordOnly, deleteAccount as deleteAccountApi } from '../lib/auth'

export function DeleteAccountScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const logout = useAppStore((s) => s.logout)

  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)

  const ready = confirmText.trim().toUpperCase() === 'DELETE'

  async function handleDelete() {
    if (!password) {
      setError('Please enter your password to confirm.')
      return
    }
    if (!currentUser) return

    setProcessing(true)
    setError('')
    try {
      const verified = await verifyPasswordOnly(currentUser.email, password)
      if (!verified) {
        setError('Incorrect password. Account not deleted.')
        setProcessing(false)
        return
      }

      await deleteAccountApi(currentUser.email)
      logout()
      setDone(true)
    } catch (e) {
      setError(
        e instanceof Error
          ? `Deletion failed: ${e.message}. Please try again or contact support.`
          : 'Deletion failed. Please try again or contact support.'
      )
      setProcessing(false)
    }
  }

  if (done) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-bg px-10 text-center">
        <div className="mb-6 text-[56px]">👋</div>
        <div className="mb-3 font-display text-2xl font-extrabold text-navy">Account Deleted</div>
        <div className="mb-10 text-sm leading-relaxed text-muted">
          Your account and personal data have been permanently removed. Thank you for using
          SplashPass.
        </div>
        <button
          type="button"
          onClick={() => navigate('/auth/login')}
          className="w-full rounded-2xl bg-accent py-4 text-[15px] font-bold text-white shadow-app-md"
        >
          Back to Sign In
        </button>
      </div>
    )
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
        <h2 className="text-base font-bold text-navy">Delete Account</h2>
      </div>

      <div className="px-6 py-6">
        {processing ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-[3px] border-danger/20 border-t-danger" />
            <div className="text-[15px] font-bold text-navy">Deleting your account...</div>
            <div className="mt-1.5 text-[13px] text-muted">This may take a moment</div>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl bg-gradient-to-br from-red-950 to-red-900 px-5 py-5">
              <div className="mb-3 text-3xl">⚠️</div>
              <div className="mb-2 font-display text-base font-extrabold text-white">
                This action is permanent
              </div>
              <div className="text-[13px] leading-relaxed text-white/70">
                Deleting your account will permanently remove your profile, cars, loyalty points,
                and subscription. This cannot be undone.
              </div>
            </div>

            <div className="mb-5 rounded-[18px] border-[1.5px] border-slate-200 bg-white p-4.5 shadow-app">
              <div className="mb-3.5 text-[11px] font-bold uppercase tracking-wide text-muted">
                What will be deleted
              </div>
              <div className="flex flex-col gap-2.5">
                <DeleteItem icon="👤" label="Your profile and personal information" />
                <DeleteItem icon="🚗" label="All registered vehicles" />
                <DeleteItem icon="⭐" label="Loyalty points and tier status" />
                <DeleteItem icon="💳" label="Active subscription" />
              </div>
            </div>

            <div className="mb-6 rounded-[18px] border-[1.5px] border-orange-200 bg-orange-50 p-4">
              <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-orange-700">
                Retained for legal compliance
              </div>
              <div className="text-[13px] leading-relaxed text-orange-800">
                Booking and payment records are anonymised and retained for 7 years as required by
                Kenyan financial regulations.
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold text-muted">
                Enter your password to confirm
              </label>
              <input
                type="password"
                placeholder="Your current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3.5 text-sm text-navy outline-none focus:border-accent"
              />
            </div>
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-semibold text-muted">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                placeholder='Type "DELETE"'
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3.5 text-sm text-navy outline-none focus:border-accent"
              />
            </div>

            {error && <div className="mb-3 text-sm text-danger">{error}</div>}

            <button
              type="button"
              disabled={!ready}
              onClick={handleDelete}
              className="w-full rounded-2xl bg-danger py-4 text-[15px] font-bold text-white shadow-app-md disabled:opacity-40"
            >
              Delete My Account Permanently
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="mt-3 w-full rounded-2xl border-[1.5px] border-slate-200 bg-white py-4 text-[15px] font-bold text-navy"
            >
              Cancel — Keep My Account
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function DeleteItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-navy">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-danger/10 text-sm">
        {icon}
      </div>
      {label}
    </div>
  )
}
