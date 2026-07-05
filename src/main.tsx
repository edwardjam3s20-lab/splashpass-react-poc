import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Controlled SW update — only reload once when a new version is ready.
// The SW listens for SKIP_WAITING rather than calling skipWaiting()
// automatically, which prevents the reload loop on mobile.
let refreshing = false
const updateSW = registerSW({
  immediate: false,
  onNeedRefresh() {
    if (refreshing) return
    refreshing = true
    // Tell the waiting SW to take over, then reload
    navigator.serviceWorker.getRegistration().then((reg) => {
      reg?.waiting?.postMessage({ type: 'SKIP_WAITING' })
    })
    updateSW(true)
  },
  onOfflineReady() {},
})

// Guard against the controllerchange event triggering a second reload
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (refreshing) return
  refreshing = true
  window.location.reload()
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
