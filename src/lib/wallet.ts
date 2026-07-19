import { apiFetch } from './tokenRefresh'

const SPLASHMAIN_BASE = import.meta.env.VITE_SPLASHMAIN_URL || 'https://splashmain.vercel.app'

export interface WalletStatus {
  balance: number
}

export interface WalletTransaction {
  id: string
  amount: number
  type: 'topup' | 'booking_payment' | 'points_conversion' | 'refund'
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

export async function fetchWalletStatus(): Promise<WalletStatus | null> {
  try {
    const res = await apiFetch(`${SPLASHMAIN_BASE}/api/wallet/status`, { credentials: 'include' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function fetchWalletTransactions(): Promise<WalletTransaction[]> {
  try {
    const res = await apiFetch(`${SPLASHMAIN_BASE}/api/wallet/transactions?limit=20`, { credentials: 'include' })
    const data = await res.json()
    return data.transactions ?? []
  } catch {
    return []
  }
}

/**
 * Initiates a wallet top-up: triggers the same M-Pesa STK push mechanism
 * used elsewhere, tagged with purpose 'wallet_topup' so the callback
 * credits the wallet rather than activating a subscription. The actual
 * balance increase happens asynchronously when the customer enters their
 * M-Pesa PIN and the callback fires — this call only confirms the prompt
 * was sent, same pattern as triggerStkPush for booking payment.
 */
export async function topUpWallet(
  phone: string,
  amount: number,
  email: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${SPLASHMAIN_BASE}/api/mpesa-stk`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        amount,
        purpose: 'wallet_topup',
        email,
        accountReference: 'SplashPass Wallet',
        transactionDesc: 'Wallet top-up',
      }),
    })
    return res.json()
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Something went wrong.' }
  }
}

/**
 * Pays for a booking directly from the wallet balance — no STK push, no
 * waiting for a callback. The backend re-checks the balance atomically
 * (decrement_wallet_balance) rather than trusting whatever balance the
 * client currently has rendered, so a stale UI can't cause an overdraw.
 */
export async function payBookingFromWallet(
  bookingId: string,
  amount: number
): Promise<{ ok: boolean; balance?: number; error?: string }> {
  try {
    const res = await apiFetch(`${SPLASHMAIN_BASE}/api/wallet/pay-booking`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, amount }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data?.error || 'Payment failed' }
    return { ok: true, balance: data.balance }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong.' }
  }
}

/**
 * Converts loyalty points to wallet cash via the existing loyalty/redeem
 * route's new 'wallet_cash' path (see splashmain's redeem route) — kept
 * in this file rather than loyaltyApi.ts since the result is a wallet
 * balance change, which is this file's concern.
 */
export async function convertPointsToWallet(
  points: number
): Promise<{ ok: boolean; walletBalance?: number; pointsRemaining?: number; error?: string }> {
  try {
    const res = await apiFetch(`${SPLASHMAIN_BASE}/api/loyalty/redeem`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redemption_type: 'wallet_cash', points }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data?.error || 'Conversion failed' }
    return { ok: true, walletBalance: data.wallet_balance, pointsRemaining: data.points_remaining }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong.' }
  }
}

export const WALLET_TX_LABELS: Record<string, string> = {
  topup: 'M-Pesa top-up',
  booking_payment: 'Wash payment',
  points_conversion: 'Points converted',
  refund: 'Refund',
}
