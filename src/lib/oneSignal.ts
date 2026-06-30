import OneSignal from 'react-onesignal'

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined
// Used for legacy Safari push support (Safari 15 and older). Not required
// for Chrome/Firefox/Edge or modern Safari, but harmless to always pass.
const ONESIGNAL_SAFARI_WEB_ID = 'web.onesignal.auto.12398f86-c304-472b-bd93-39635fc69310'

let initPromise: Promise<void> | null = null

/**
 * Initializes the OneSignal Web SDK once per page load. Safe to call
 * multiple times — subsequent calls reuse the same in-flight/completed
 * promise rather than re-initializing.
 *
 * Uses the combined service worker at /sw.js (built by vite-plugin-pwa from
 * src/sw.ts, which importScripts the OneSignal worker — see src/sw.ts for
 * why this is combined rather than a separate OneSignalSDKWorker.js).
 *
 * No-ops if VITE_ONESIGNAL_APP_ID isn't set, so local/dev builds without
 * the env var configured don't throw — they just won't have push enabled.
 */
export function initOneSignal(): Promise<void> {
  if (initPromise) return initPromise

  if (!ONESIGNAL_APP_ID) {
    console.warn('[SplashPass] VITE_ONESIGNAL_APP_ID is not set — push notifications disabled.')
    initPromise = Promise.resolve()
    return initPromise
  }

  initPromise = OneSignal.init({
    appId: ONESIGNAL_APP_ID,
    safari_web_id: ONESIGNAL_SAFARI_WEB_ID,
    serviceWorkerPath: 'sw.js',
    serviceWorkerParam: { scope: '/' },
    // We show our own opt-in UI (see promptPushNotifications below) AND
    // OneSignal's floating subscription bell — both trigger the same
    // underlying subscribe flow, just two discovery points for the user.
    // autoRegister stays false so neither prompts automatically on load;
    // both require a user gesture (clicking the bell, or our button).
    autoRegister: false,
    notifyButton: {
      enable: true,
      prenotify: true,
      showCredit: false,
      size: 'medium',
      position: 'bottom-right',
      text: {
        'tip.state.unsubscribed': 'Subscribe to notifications',
        'tip.state.subscribed': 'You\u2019re subscribed to notifications',
        'tip.state.blocked': 'You\u2019ve blocked notifications',
        'message.prenotify': 'Click to subscribe to notifications',
        'message.action.subscribed': 'Thanks for subscribing!',
        'message.action.resubscribed': 'You\u2019re subscribed to notifications',
        'message.action.unsubscribed': 'You won\u2019t receive notifications again',
        'message.action.subscribing': 'Subscribing\u2026',
        'dialog.main.title': 'Manage Notifications',
        'dialog.main.button.subscribe': 'Subscribe',
        'dialog.main.button.unsubscribe': 'Unsubscribe',
        'dialog.blocked.title': 'Unblock Notifications',
        'dialog.blocked.message': 'Follow these instructions to allow notifications:',
      },
    },
  }).catch((err) => {
    console.error('[SplashPass] OneSignal init failed:', err)
  })

  return initPromise
}

export type PushOptInResult = 'granted' | 'denied' | 'unsupported' | 'error'

/**
 * Triggers the browser's native push permission prompt via OneSignal.
 * Call this from a user gesture (e.g. a button tap on a "Get notified
 * about your bookings" screen) — browsers may ignore permission requests
 * not triggered by direct user interaction.
 */
export async function promptPushNotifications(): Promise<PushOptInResult> {
  if (!ONESIGNAL_APP_ID) return 'unsupported'
  if (!('Notification' in window)) return 'unsupported'

  await initOneSignal()

  try {
    await OneSignal.Slidedown.promptPush()
    // OneSignal.Notifications.permission is a boolean property (not a
    // promise) reflecting the current browser Notification permission.
    return OneSignal.Notifications.permission ? 'granted' : 'denied'
  } catch (err) {
    console.error('[SplashPass] OneSignal opt-in prompt failed:', err)
    return 'error'
  }
}

export async function isPushOptedIn(): Promise<boolean> {
  if (!ONESIGNAL_APP_ID) return false
  await initOneSignal()
  try {
    return OneSignal.Notifications.permission
  } catch {
    return false
  }
}
