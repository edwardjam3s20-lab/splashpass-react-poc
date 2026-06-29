const SPLASHMAIN_BASE = import.meta.env.VITE_SPLASHMAIN_URL || 'https://splashmain.vercel.app'
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export type PushSupport = 'unsupported' | 'denied' | 'granted' | 'default'

export function getPushSupport(): PushSupport {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission as PushSupport
}

export async function isSubscribedToReminders(): Promise<boolean> {
  if (getPushSupport() !== 'granted') return false
  if (!('serviceWorker' in navigator)) return false
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return false
  const subscription = await registration.pushManager.getSubscription()
  return !!subscription
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length))
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

/**
 * Full subscribe flow — must be called from a user gesture. Saves the
 * subscription to splashmain's customer_push_subscriptions table, keyed
 * by the logged-in customer's email (passed in by the caller, which
 * already has it from currentUser).
 */
export async function subscribeToReminders(email: string): Promise<{ ok: boolean; message: string }> {
  const support = getPushSupport()
  if (support === 'unsupported') {
    return { ok: false, message: 'Reminders are not supported on this browser/device.' }
  }
  if (!VAPID_PUBLIC_KEY) {
    return { ok: false, message: 'Reminders are not configured for this build.' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, message: 'Notification permission was not granted.' }
  }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const res = await fetch(`${SPLASHMAIN_BASE}/api/customer/reminders/subscribe`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, subscription: subscription.toJSON() }),
  })

  if (!res.ok) {
    return { ok: false, message: 'Could not save reminder subscription.' }
  }

  return { ok: true, message: 'Booking reminders enabled.' }
}

export async function unsubscribeFromReminders(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return
  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  await fetch(`${SPLASHMAIN_BASE}/api/customer/reminders/unsubscribe`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  }).catch(() => {})
}
