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

export async function triggerStkPush(
  phone: string,
  amount: number,
  options?: StkPushOptions
): Promise<StkPushResult> {
  const res = await fetch('/api/mpesa-stk', {
    method: 'POST',
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
export async function sendBookingRequestSms(
  phone: string,
  pointName: string,
  date: string,
  slotTime: string
): Promise<boolean> {
  try {
    const message = `SplashPass: Your booking request at ${pointName} for ${date} ${slotTime} has been sent. We'll notify you once the operator responds.`
    const res = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
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
    const message = `SplashPass Booking Confirmed! Location: ${pointName} | Date: ${date} | Time: ${slotTime}. Show QR code to attendant.`
    const res = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    })
    const data = await res.json()
    return Boolean(data.success)
  } catch {
    return false
  }
}
