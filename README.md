# SplashPass — React migration (work in progress)

## Setup

```bash
npm install
cp .env.example .env   # fill in real values, see below
```

## Running locally — two modes

### 1. UI / data work (map, auth, onboarding, browsing wash points)

```bash
npm run dev
```

Opens on `http://localhost:5173`. Talks directly to Supabase. **The `/api/*`
routes (M-Pesa STK push, SMS) will NOT work in this mode** — Vite's dev
server only serves the frontend, it doesn't run the serverless functions in
`/api`. Calls to `/api/mpesa-stk` or `/api/send-sms` will 404.

### 2. Testing the booking → payment → SMS flow

You need the Vercel CLI to run the API routes locally alongside the frontend:

```bash
npm install -g vercel
vercel dev
```

This runs both the Vite app and the `/api` serverless functions together
(typically on `http://localhost:3000`). You'll need a `.env` with the M-Pesa
and Africa's Talking variables filled in (see `.env.example`) — Safaricom's
Daraja **sandbox** test credentials are fine for this, see their docs at
https://developer.safaricom.co.ke.

## Deploying a standalone preview (NOT your production splashmain deployment)

This is a separate, throwaway Vercel project purely for testing this React
port end-to-end (real STK push sandbox flow, real SMS sandbox flow) without
touching your live `splashmain` deployment.

```bash
vercel link    # choose "no" when asked to link to an existing project,
                # create a new one, e.g. "splashpass-react-poc"
vercel env add MPESA_CONSUMER_KEY
vercel env add MPESA_CONSUMER_SECRET
vercel env add MPESA_PASSKEY
vercel env add AT_API_KEY
# ...repeat for any other vars in .env.example you want to set
vercel deploy
```

Once deployed, the preview URL Vercel gives you will have working `/api`
routes (same origin, so the frontend's relative `fetch('/api/mpesa-stk')`
calls just work).

## Important notes

- `MPESA_CALLBACK_URL` in `.env.example` points at your **live** splashmain
  deployment's `/api/mpesa-callback` endpoint. That's intentional for now —
  the callback handler itself isn't ported into this project, and since both
  projects share the same Supabase database, letting the real callback write
  to the same `bookings` table works fine. If you'd rather isolate this POC
  completely, you'd need to also port the callback handler here and point
  `MPESA_CALLBACK_URL` at this project's own deployed URL instead.
- This project is intentionally **not** linked to your `splashmain` Vercel
  project. It's a separate deployment for testing only.
