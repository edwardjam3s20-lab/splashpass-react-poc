/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
clientsClaim()

interface ReminderPushPayload {
  title: string
  body: string
  bookingId?: string
  url?: string
}

self.addEventListener('push', (event: PushEvent) => {
  let payload: ReminderPushPayload = {
    title: 'SplashPass',
    body: 'You have a new notification.',
  }

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() }
    } catch {
      payload = { ...payload, body: event.data.text() }
    }
  }

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
