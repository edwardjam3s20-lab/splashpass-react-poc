// src/lib/tokenRefresh.ts
// Client side of the access/refresh token lifecycle.
//
// Access tokens live 15 minutes. This module keeps one alive silently in
// the background (scheduleSilentRefresh) so the user never sees a login
// screen mid-session, falls back to a single reactive refresh-and-retry on
// any unexpected 401 (apiFetch), and only actually interrupts the user —
// via the hard-logout handler — when the refresh token itself has died
// (30 days idle, or revoked, e.g. reuse detection on the server).

const API = import.meta.env.VITE_API_BASE_URL as string

const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000
// Refresh at 80% of the access token's life, not 100% — this leaves margin
// for a slow network / a backgrounded tab throttling timers, so the old
// token is very unlikely to have actually expired by the time the refresh
// call lands.
const SILENT_REFRESH_DELAY_MS = ACCESS_TOKEN_LIFETIME_MS * 0.8

let refreshTimer: ReturnType<typeof setTimeout> | null = null
let onHardLogout: (() => void) | null = null

// RequireAuth registers the "session is really over" handler once, on
// mount, so this module doesn't need to import the store directly.
export function registerHardLogoutHandler(fn: () => void) {
  onHardLogout = fn
}

async function callRefreshEndpoint(): Promise<boolean> {
  try {
    const res = await fetch(`${API}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    return res.ok
  } catch {
    // Network blip, not a session failure — the next scheduled attempt
    // (or the apiFetch backstop) will retry. Don't treat this as a hard
    // logout just because one request failed to reach the network.
    return false
  }
}

export function stopSilentRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

export function scheduleSilentRefresh() {
  stopSilentRefresh()
  refreshTimer = setTimeout(async () => {
    const ok = await callRefreshEndpoint()
    if (ok) {
      scheduleSilentRefresh() // keep the cycle going invisibly
    } else {
      onHardLogout?.()
    }
  }, SILENT_REFRESH_DELAY_MS)
}

// Backstop for requests that land in the small window where the access
// token has expired but the scheduled silent refresh hasn't fired yet
// (e.g. device was asleep, tab was frozen in the background). One refresh
// attempt, then retry the original request once. Use this instead of raw
// fetch() for any authenticated request that isn't already covered by the
// silent refresh cycle.
export async function apiFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const opts: RequestInit = { ...init, credentials: 'include' }
  const res = await fetch(input, opts)

  if (res.status !== 401) return res

  const refreshed = await callRefreshEndpoint()
  if (!refreshed) {
    onHardLogout?.()
    return res
  }

  scheduleSilentRefresh() // restart the silent cycle against the freshly rotated token
  return fetch(input, opts)
}

// ─── State preservation across a forced re-login ───────────────────────────
// When the refresh token itself is dead, the user gets bounced to /auth —
// but "graceful" means they land back exactly where they were afterward,
// not on /home with a lost booking cart or half-filled form.

const RESUME_KEY = 'splashpass_resume_path'

export function saveResumePath() {
  const path = window.location.pathname + window.location.search
  if (path && path !== '/welcome' && !path.startsWith('/auth')) {
    sessionStorage.setItem(RESUME_KEY, path)
  }
}

export function popResumePath(): string | null {
  const path = sessionStorage.getItem(RESUME_KEY)
  if (path) sessionStorage.removeItem(RESUME_KEY)
  return path
}
