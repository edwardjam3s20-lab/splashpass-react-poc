/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

// OneSignal's worker is combined into this file (rather than living at its
// own scope) so the whole site only ever has one active service worker.
// See: https://documentation.onesignal.com/docs/onesignal-service-worker
// — "Combining multiple service workers".
// OneSignal registers its own push/notificationclick listeners internally;
// our own listeners below are scoped to only react to OUR payload shape
// (identified by the `source: 'splashpass'` marker our backend sets), so
// the two providers don't double-fire or fight over the same push event.
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js')

precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
clientsClaim()

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
    // Not JSON — not one of ours (our backend always sends JSON with a
    // `source` marker). Let OneSignal's own listener handle it if it's
    // theirs; otherwise this push is silently ignored, same as before.
    return
  }

  // Only handle pushes that are explicitly ours. Anything else (including
  // OneSignal pushes) is left for OneSignal's own internal listener to
  // process — we never call showNotification for a payload we don't
  // recognize, which avoids duplicate/garbled notifications.
  if (!isSplashPassPayload(parsed)) return

  const payload = parsed
  const url = payload.url || '/bookings'

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
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
