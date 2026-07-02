import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Register service worker with a controlled update flow.
// onNeedRefresh fires when a new SW is waiting — we reload once rather than
// letting skipWaiting() cause a loop on mobile.
let refreshing = false
registerSW({
  immediate: false,
  onNeedRefresh(updateSW) {
    // Only reload once — guard against the controllerchange firing twice
    if (refreshing) return
    refreshing = true
    updateSW(true)
  },
  onOfflineReady() {
    // App is ready to work offline — no action needed
  },
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
