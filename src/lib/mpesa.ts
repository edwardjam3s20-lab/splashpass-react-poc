export interface StkPushResult {
  success: boolean
  message?: string
}

export interface StkPushOptions {
  purpose?: 'subscription' | 'booking_payment' | 'wallet_topup'
  email?: string
  bookingId?: string
  accountReference?: string
  transactionDesc?: string
}

const API = import.meta.env.VITE_API_BASE_URL as string

export async function triggerStkPush(
  phone: string,
  amount: number,
  options?: StkPushOptions
): Promise<StkPushResult> {
  const res = await fetch(`${API}/api/mpesa-stk`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, amount, ...options }),
  })
  return res.json()
}

/**
 * Sent the moment a booking request is created (status: pending), before
 * any payment — distinct from `sendBookingSms` below, which announces a
 * *confirmed* (paid) booking. Wording is intentionally different: this one
 * sets the expectation that the operator still needs to respond.
 */
// NOTE: the server now builds the message text itself from a fixed
// template keyed by `type` — it no longer accepts free-text `message`.
// This closes off the endpoint from being usable to send arbitrary text
// (see api/send-sms.js). If you add a new notification type, add a
// matching template there first.

export async function sendBookingRequestSms(
  phone: string,
  pointName: string,
  date: string,
  slotTime: string
): Promise<boolean> {
  try {
    const res = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, type: 'booking_request', pointName, date, slotTime }),
    })
    const data = await res.json()
    return Boolean(data.success)
  } catch {
    return false
  }
}

export async function sendBookingSms(
  phone: string,
  pointName: string,
  date: string,
  slotTime: string
): Promise<boolean> {
  try {
    const res = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, type: 'booking_confirmed', pointName, date, slotTime }),
    })
    const data = await res.json()
    return Boolean(data.success)
  } catch {
    return false
  }
}
