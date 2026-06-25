import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { deleteAccount } from '../lib/auth'

export function DeleteAccountScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const logout = useAppStore((s) => s.logout)
  const showToast = useAppStore((s) => s.showToast)
  const [confirm, setConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    if (!currentUser) return
    if (confirm.trim().toLowerCase() !== 'delete') { setError('Please type "delete" to confirm.'); return }
    setDeleting(true); setError('')
    try {
      await deleteAccount(currentUser.email)
      logout(); showToast('Account deleted.'); navigate('/welcome', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete account.')
    } finally { setDeleting(false) }
  }

  return (
    <div className="flex h-full flex-col" style={{ background: '#F5F5F7' }}>
      <div className="flex items-center gap-3 bg-white px-4 py-4" style={{ boxShadow: '0 1px 0 #EBEBED' }}>
        <button onClick={() => navigate(-1)} className="sp-press flex h-9 w-9 items-center justify-center rounded-[11px] text-lg text-ink" style={{ background: '#F5F5F7' }}>←</button>
        <div className="text-[16px] font-extrabold text-ink" style={{ letterSpacing: '-0.3px' }}>Delete Account</div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full text-[30px] mx-auto mb-4" style={{ background: '#FFF0EE', border: '2px solid #FF3B30' }}>🗑️</div>
        <div className="text-[20px] font-extrabold text-ink mb-2" style={{ letterSpacing: '-0.4px' }}>Delete your account?</div>
        <p className="text-[14px] text-muted mb-8 leading-relaxed max-w-[280px] mx-auto">
          This permanently removes all your data, bookings, and loyalty points. This cannot be undone.
        </p>
        <div className="text-left mb-3">
          <label className="block text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-2">Type "delete" to confirm</label>
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="delete"
            className="w-full rounded-[14px] px-4 py-3.5 text-[15px] font-medium text-ink bg-white outline-none"
            style={{ border: '1.5px solid #EBEBED' }} />
        </div>
        {error && <div className="text-[13px] mb-3" style={{ color: '#FF3B30' }}>{error}</div>}
        <button onClick={handleDelete} disabled={deleting}
          className="sp-press w-full rounded-[16px] py-4 mb-3 text-[15px] font-extrabold text-white"
          style={{ background: '#FF3B30', boxShadow: '0 8px 24px rgba(255,59,48,0.3)', opacity: deleting ? 0.6 : 1 }}>
          {deleting ? 'Deleting…' : 'Delete Account'}
        </button>
        <button onClick={() => navigate(-1)}
          className="sp-press w-full rounded-[16px] py-4 text-[15px] font-bold text-ink"
          style={{ background: '#F5F5F7', border: '1px solid #EBEBED' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
