export interface StkPushResult {
  success: boolean
  message?: string
}

export async function triggerStkPush(phone: string, amount: number): Promise<StkPushResult> {
  const res = await fetch('/api/mpesa-stk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, amount }),
  })
  return res.json()
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
