import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// registerSW returns the update function directly.
// onNeedRefresh fires with no args when a new SW is waiting.
// We call updateSW() once to activate it — the refreshing guard
// prevents the controllerchange event from triggering a second reload.
let refreshing = false
const updateSW = registerSW({
  immediate: false,
  onNeedRefresh() {
    if (refreshing) return
    refreshing = true
    updateSW(true)
  },
  onOfflineReady() {},
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
