/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

// OneSignal combined into this worker — see comments in previous version.
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js')

precacheAndRoute(self.__WB_MANIFEST)

// Skip waiting only when explicitly told to by the app (via postMessage).
// This prevents the automatic reload loop on mobile where skipWaiting() +
// clientsClaim() causes every new deployment to trigger an infinite reload.
// The app's main.tsx calls updateSW(true) via onNeedRefresh which sends
// this message, giving us one controlled reload instead of a loop.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

interface ReminderPushPayload {
  source: 'splashpass'
  title: string
  body: string
  bookingId?: string
  url?: string
}

function isSplashPassPayload(data: unknown): data is ReminderPushPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { source?: unknown }).source === 'splashpass'
  )
}

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  let parsed: unknown
  try {
    parsed = event.data.json()
  } catch {
    return
  }

  if (!isSplashPassPayload(parsed)) return

  const payload = parsed
  const url = payload.url || '/bookings'

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/favicon-32.png',
      tag: payload.bookingId ? `reminder-${payload.bookingId}` : undefined,
      renotify: true,
      data: { url },
    } as NotificationOptions)
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string } | undefined)?.url || '/bookings'

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of allClients) {
        if ('focus' in client) {
          await (client as WindowClient).navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })()
  )
})
