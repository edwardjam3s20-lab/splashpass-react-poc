// Thin wrapper around Paystack's Inline JS popup (loaded on demand, not
// bundled — https://js.paystack.co/v1/inline.js). Card details are
// entered inside Paystack's own hosted iframe; this app never sees or
// touches raw card numbers, which keeps it out of PCI scope.

declare global {
  interface Window {
    PaystackPop?: {
      setup: (opts: Record<string, unknown>) => { openIframe: () => void }
    }
  }
}

const PAYSTACK_SCRIPT_URL = 'https://js.paystack.co/v1/inline.js'
let scriptPromise: Promise<void> | null = null

function loadPaystackScript(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = PAYSTACK_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => { scriptPromise = null; reject(new Error('Could not load the card payment form. Check your connection and try again.')) }
    document.body.appendChild(script)
  })
  return scriptPromise
}

export interface PaystackChargeOptions {
  email: string
  amountKES: number
  metadata?: Record<string, unknown>
}

export class PaystackCancelledError extends Error {}

/** Opens the Paystack card popup. Resolves with the transaction reference
 *  on success; rejects with PaystackCancelledError if the user closes the
 *  popup, or a plain Error for load/config failures. This reference is
 *  NOT proof of payment by itself — always confirm via verifyPaystackPayment
 *  before treating anything as paid. */
export function payWithPaystackCard(opts: PaystackChargeOptions): Promise<{ reference: string }> {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined
  if (!publicKey) return Promise.reject(new Error('Card payments are not set up yet.'))

  return loadPaystackScript().then(
    () =>
      new Promise<{ reference: string }>((resolve, reject) => {
        if (!window.PaystackPop) { reject(new Error('Could not load the card payment form.')); return }
        const reference = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: opts.email,
          amount: Math.round(opts.amountKES * 100), // Paystack expects the amount in the lowest currency subunit
          currency: 'KES',
          ref: reference,
          metadata: opts.metadata || {},
          callback: (response: { reference: string }) => resolve({ reference: response.reference }),
          onClose: () => reject(new PaystackCancelledError('Payment cancelled.')),
        })
        handler.openIframe()
      })
  )
}

const API = import.meta.env.VITE_API_BASE_URL as string

/** Server-side verification — the only step that actually confirms money
 *  moved. Never treat the popup's callback alone as a successful payment. */
export async function verifyPaystackPayment(
  reference: string,
  planId: string,
  email: string
): Promise<{ profile: import('../types/database').Profile }> {
  const res = await fetch(`${API}/api/paystack/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference, planId, email }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Could not verify payment.')
  return data
}
