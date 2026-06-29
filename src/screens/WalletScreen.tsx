import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import {
  fetchWalletStatus, fetchWalletTransactions, topUpWallet, convertPointsToWallet,
  WALLET_TX_LABELS, type WalletTransaction,
} from '../lib/wallet'

const POLL_INTERVAL_MS = 4000
const MAX_POLL_ATTEMPTS = 15 // 60s, matching the booking-payment poll's ceiling

function TxRow({ tx }: { tx: WalletTransaction }) {
  const isPositive = tx.amount > 0
  const label = WALLET_TX_LABELS[tx.type] || tx.type
  const date = new Date(tx.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #EBEBED' }}>
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] text-sm"
        style={{ background: isPositive ? '#E8F9ED' : '#FFF0EE' }}
      >
        {isPositive ? '⬆' : '⬇'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-ink truncate">{label}</div>
        <div className="text-[11px] text-muted mt-0.5">
          {date}{tx.status === 'pending' ? ' · Pending' : tx.status === 'failed' ? ' · Failed' : ''}
        </div>
      </div>
      <div className="text-[14px] font-extrabold flex-shrink-0" style={{ color: isPositive ? '#30D158' : '#FF3B30' }}>
        {isPositive ? '+' : ''}KSh {Math.abs(tx.amount).toLocaleString()}
      </div>
    </div>
  )
}

export function WalletScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const showToast = useAppStore((s) => s.showToast)

  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[] | null>(null)
  const [txError, setTxError] = useState(false)

  const [showTopUp, setShowTopUp] = useState(false)
  const [showConvert, setShowConvert] = useState(false)

  function loadBalance() {
    fetchWalletStatus().then((s) => { if (s) setBalance(s.balance) })
  }
  function loadTransactions() {
    setTxError(false)
    fetchWalletTransactions().then(setTransactions).catch(() => setTxError(true))
  }

  useEffect(() => { loadBalance(); loadTransactions() }, [])

  return (
    <div style={{ background: '#F5F5F7', minHeight: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-6" style={{ background: 'linear-gradient(160deg, #0A1628 0%, #0A2A3A 100%)' }}>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/home')}
            className="sp-press flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] text-base text-white"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            ←
          </button>
          <div className="text-[20px] font-extrabold text-white" style={{ letterSpacing: '-0.4px' }}>
            Wallet
          </div>
        </div>

        <div className="text-[13px] mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Available Balance</div>
        <div className="text-[44px] font-extrabold text-white leading-none mb-4" style={{ letterSpacing: '-1.5px' }}>
          {balance == null ? '···' : `KSh ${balance.toLocaleString()}`}
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => setShowTopUp(true)}
            className="sp-press flex-1 rounded-[13px] py-3 text-[14px] font-bold text-white"
            style={{ background: '#0A84FF' }}
          >
            + Top Up
          </button>
          <button
            onClick={() => setShowConvert(true)}
            className="sp-press flex-1 rounded-[13px] py-3 text-[14px] font-bold"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
          >
            ⭐ Convert Points
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-3">Transaction History</div>
        <div className="rounded-[18px] bg-white overflow-hidden" style={{ border: '1px solid #EBEBED', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {txError ? (
            <div className="py-5 text-center text-[13px]" style={{ color: '#FF3B30' }}>Could not load history.</div>
          ) : transactions === null ? (
            <div className="p-4">
              {[80, 60, 72].map((w, i) => (
                <div key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: i < 2 ? '1px solid #EBEBED' : 'none' }}>
                  <div className="sp-skeleton h-8 w-8 rounded-[10px] flex-shrink-0" />
                  <div className="flex-1">
                    <div className="sp-skeleton h-3.5 rounded mb-1.5" style={{ width: `${w}%` }} />
                    <div className="sp-skeleton h-2.5 rounded w-20" />
                  </div>
                  <div className="sp-skeleton h-4 w-14 rounded" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-3xl mb-2">👛</div>
              <div className="text-[14px] font-bold text-ink mb-1">No transactions yet</div>
              <div className="text-[12px] text-muted">Top up to get started</div>
            </div>
          ) : (
            transactions.map((tx) => <TxRow key={tx.id} tx={tx} />)
          )}
        </div>
      </div>

      {showTopUp && (
        <TopUpSheet
          phone={currentUser?.phone ?? ''}
          email={currentUser?.email ?? ''}
          onClose={() => setShowTopUp(false)}
          onSuccess={() => { loadBalance(); loadTransactions() }}
          showToast={showToast}
        />
      )}

      {showConvert && (
        <ConvertSheet
          points={currentUser?.loyalty_points || 0}
          onClose={() => setShowConvert(false)}
          onSuccess={(newBalance) => { setBalance(newBalance); loadTransactions() }}
          showToast={showToast}
        />
      )}
    </div>
  )
}

// ── Top-up bottom sheet ─────────────────────────
function TopUpSheet({
  phone, email, onClose, onSuccess, showToast,
}: {
  phone: string
  email: string
  onClose: () => void
  onSuccess: () => void
  showToast: (msg: string, isError?: boolean) => void
}) {
  const [amount, setAmount] = useState('')
  const [phoneInput, setPhoneInput] = useState(phone)
  const [stage, setStage] = useState<'input' | 'waiting' | 'success'>('input')
  const [error, setError] = useState('')
  const pollRef = useRef<{ attempts: number; timer: ReturnType<typeof setInterval> | null }>({ attempts: 0, timer: null })

  useEffect(() => {
    const ref = pollRef.current
    return () => { if (ref.timer) clearInterval(ref.timer) }
  }, [])

  async function handleTopUp() {
    const amt = parseInt(amount, 10)
    if (!amt || amt <= 0) { setError('Enter a valid amount.'); return }
    if (!phoneInput.trim()) { setError('Enter your M-Pesa number.'); return }
    setError('')
    setStage('waiting')

    const result = await topUpWallet(phoneInput.trim(), amt, email)
    if (!result.success) {
      setError(result.message || 'Could not send M-Pesa prompt. Try again.')
      setStage('input')
      return
    }

    showToast('M-Pesa prompt sent — enter your PIN')

    // Poll wallet balance until it reflects the top-up, or time out.
    const startBalance = await fetchWalletStatus().then((s) => s?.balance ?? null)
    pollRef.current.attempts = 0
    pollRef.current.timer = setInterval(async () => {
      pollRef.current.attempts += 1
      const status = await fetchWalletStatus()
      if (status && startBalance != null && status.balance > startBalance) {
        if (pollRef.current.timer) clearInterval(pollRef.current.timer)
        setStage('success')
        onSuccess()
        setTimeout(onClose, 1200)
        return
      }
      if (pollRef.current.attempts >= MAX_POLL_ATTEMPTS) {
        if (pollRef.current.timer) clearInterval(pollRef.current.timer)
        setError('Still waiting for confirmation. Check your M-Pesa messages — your balance will update once it arrives.')
        setStage('input')
      }
    }, POLL_INTERVAL_MS)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-[24px] bg-white px-5 pt-6"
        style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full" style={{ background: '#EBEBED' }} />

        {stage === 'success' ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <div className="text-[17px] font-extrabold text-ink mb-1">Wallet topped up!</div>
          </div>
        ) : (
          <>
            <div className="text-[18px] font-extrabold text-ink mb-1">Top Up Wallet</div>
            <div className="text-[13px] text-muted mb-4">Enter any amount — paid via M-Pesa</div>

            <label className="block text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-1.5">Amount (KSh)</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={stage === 'waiting'}
              className="w-full rounded-[14px] px-4 py-3.5 mb-3 text-[18px] font-bold text-ink outline-none"
              style={{ border: '1.5px solid #EBEBED' }}
            />

            <label className="block text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-1.5">M-Pesa Number</label>
            <input
              type="tel"
              placeholder="0712 345 678"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              disabled={stage === 'waiting'}
              className="w-full rounded-[14px] px-4 py-3.5 mb-4 text-[15px] font-semibold text-ink outline-none"
              style={{ border: '1.5px solid #EBEBED' }}
            />

            {error && (
              <div className="rounded-[12px] px-3.5 py-2.5 mb-3 text-[13px]" style={{ background: '#FFF0EE', color: '#CC2222' }}>
                {error}
              </div>
            )}

            {stage === 'waiting' && (
              <div className="rounded-[12px] px-3.5 py-2.5 mb-3 text-[13px] flex items-center gap-2" style={{ background: '#E0FAF9', color: '#0A2820' }}>
                <span>⏳</span> Enter your M-Pesa PIN on your phone…
              </div>
            )}

            <button
              onClick={handleTopUp}
              disabled={stage === 'waiting'}
              className="sp-press w-full rounded-[16px] py-4 mb-2.5 text-[15px] font-extrabold text-white"
              style={{ background: '#0A84FF', opacity: stage === 'waiting' ? 0.5 : 1 }}
            >
              {stage === 'waiting' ? 'Waiting for payment…' : 'Send M-Pesa Prompt'}
            </button>
            <button onClick={onClose} className="w-full rounded-[16px] py-3.5 text-[14px] font-bold text-ink" style={{ background: '#F5F5F7' }}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Convert points bottom sheet ─────────────────
function ConvertSheet({
  points, onClose, onSuccess, showToast,
}: {
  points: number
  onClose: () => void
  onSuccess: (newBalance: number) => void
  showToast: (msg: string, isError?: boolean) => void
}) {
  const POINTS_PER_KSH = 10
  const maxKsh = Math.floor(points / POINTS_PER_KSH)
  const [ksh, setKsh] = useState(String(Math.min(maxKsh, 100) || 0))
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState('')

  async function handleConvert() {
    const kshAmount = parseInt(ksh, 10)
    if (!kshAmount || kshAmount <= 0) { setError('Enter a valid amount.'); return }
    if (kshAmount > maxKsh) { setError(`You only have enough points for KSh ${maxKsh}.`); return }
    setError('')
    setConverting(true)
    const result = await convertPointsToWallet(kshAmount * POINTS_PER_KSH)
    setConverting(false)
    if (!result.ok) { setError(result.error || 'Conversion failed.'); return }
    showToast(`Converted ${kshAmount * POINTS_PER_KSH} pts → KSh ${kshAmount}`)
    onSuccess(result.walletBalance ?? 0)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-[24px] bg-white px-5 pt-6"
        style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full" style={{ background: '#EBEBED' }} />
        <div className="text-[18px] font-extrabold text-ink mb-1">Convert Points</div>
        <div className="text-[13px] text-muted mb-4">
          {POINTS_PER_KSH} points = KSh 1 · You have {points.toLocaleString()} pts (up to KSh {maxKsh.toLocaleString()})
        </div>

        <label className="block text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-1.5">Amount to add (KSh)</label>
        <input
          type="number"
          inputMode="numeric"
          value={ksh}
          onChange={(e) => setKsh(e.target.value)}
          max={maxKsh}
          className="w-full rounded-[14px] px-4 py-3.5 mb-1 text-[18px] font-bold text-ink outline-none"
          style={{ border: '1.5px solid #EBEBED' }}
        />
        <div className="text-[12px] text-muted mb-4">
          Uses {(parseInt(ksh, 10) || 0) * POINTS_PER_KSH} points
        </div>

        {error && (
          <div className="rounded-[12px] px-3.5 py-2.5 mb-3 text-[13px]" style={{ background: '#FFF0EE', color: '#CC2222' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleConvert}
          disabled={converting || maxKsh <= 0}
          className="sp-press w-full rounded-[16px] py-4 mb-2.5 text-[15px] font-extrabold text-white disabled:opacity-50"
          style={{ background: '#0A84FF' }}
        >
          {converting ? 'Converting…' : 'Convert to Wallet'}
        </button>
        <button onClick={onClose} className="w-full rounded-[16px] py-3.5 text-[14px] font-bold text-ink" style={{ background: '#F5F5F7' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
