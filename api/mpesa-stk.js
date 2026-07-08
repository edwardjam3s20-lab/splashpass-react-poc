const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const PASSKEY = process.env.MPESA_PASSKEY;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://splashmain.vercel.app/api/mpesa-callback';
const MPESA_BASE = process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Comma-separated list of origins allowed to call this endpoint, e.g.
// "https://app.splashpass.site,https://splashmain.vercel.app". Falls back
// to the known production origin so this fails safe (deny-by-default)
// rather than open (`*`) if the env var isn't set.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://splashmain.vercel.app')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Hard ceiling on any single STK push this route will initiate. Adjust to
// match the real maximum a legitimate booking/subscription/top-up could
// ever cost — this exists purely to bound the damage of a caller sending
// an arbitrary amount, not to be the "real" price validation (that's the
// booking-ownership check further down for booking_payment specifically).
const MAX_STK_AMOUNT = 50000;

const KENYAN_PHONE_RE = /^254(7|1)\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_PURPOSES = new Set(['subscription', 'booking_payment', 'wallet_topup']);

function normalisePhone(phone) {
  let normalised = String(phone).replace(/\s+/g, '').replace(/^\+/, '');
  if (normalised.startsWith('07') || normalised.startsWith('01')) {
    normalised = '254' + normalised.slice(1);
  }
  return normalised;
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

async function checkRateLimit(bucketKey, windowSeconds, maxRequests) {
  // Fails CLOSED: if Supabase/env isn't configured, or the check itself
  // errors, we deny rather than silently allow unlimited requests through.
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_rate_limit`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_bucket_key: bucketKey,
        p_window_seconds: windowSeconds,
        p_max_requests: maxRequests,
      }),
    });
    if (!res.ok) return false;
    const rows = await res.json();
    return Boolean(rows?.[0]?.allowed);
  } catch (e) {
    console.error('rate limit check failed:', e.message);
    return false;
  }
}

// For a booking payment specifically, don't trust the client's amount or
// email at all — look the booking up server-side and verify: (a) the
// email claiming to pay for it actually owns it, (b) it isn't already
// paid, and (c) the amount matches what the booking actually costs. This
// closes the gap where anyone could POST any bookingId/email/amount
// combination and tag an arbitrary STK push as a payment for someone
// else's booking.
async function verifyBookingPayment(bookingId, email, amount) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return { ok: false, reason: 'not configured' };
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}&select=user_email,total_amount,payment_status`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    if (!res.ok) return { ok: false, reason: 'lookup failed' };
    const rows = await res.json();
    const booking = rows?.[0];
    if (!booking) return { ok: false, reason: 'booking not found' };
    if (booking.payment_status === 'paid') return { ok: false, reason: 'already paid' };
    if (String(booking.user_email).toLowerCase() !== String(email).toLowerCase()) {
      return { ok: false, reason: 'email does not match booking owner' };
    }
    if (Math.abs(Number(booking.total_amount) - Number(amount)) > 0.01) {
      return { ok: false, reason: 'amount does not match booking total' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

async function getAccessToken() {
  const credentials = Buffer.from(CONSUMER_KEY + ':' + CONSUMER_SECRET).toString('base64');
  const res = await fetch(MPESA_BASE + '/oauth/v1/generate?grant_type=client_credentials', {
    headers: { 'Authorization': 'Basic ' + credentials }
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get access token');
  return data.access_token;
}

function getTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());
}

async function recordPendingTransaction({ checkoutRequestId, purpose, email, amount, bookingId }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('pending_transactions write skipped: Supabase service env vars not configured');
    return;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pending_transactions`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        checkout_request_id: checkoutRequestId,
        purpose,
        user_email: email,
        amount,
        booking_id: bookingId || null,
      }),
    });
    if (!res.ok) {
      console.error('pending_transactions insert failed:', res.status, await res.text());
    }
  } catch (e) {
    console.error('pending_transactions insert error:', e.message);
  }
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  // Reject cross-origin calls outright rather than merely omitting the
  // CORS header (browsers block those, but this also blocks direct
  // server-to-server abuse from anywhere that isn't a listed origin).
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ message: 'Origin not allowed' });
  }

  if (!CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY) {
    console.error('M-Pesa error: MPESA_CONSUMER_KEY/MPESA_CONSUMER_SECRET/MPESA_PASSKEY not configured');
    return res.status(503).json({ message: 'M-Pesa service is not configured' });
  }

  try {
    const {
      phone,
      amount,
      purpose,
      email,
      bookingId,
      accountReference,
      transactionDesc,
    } = req.body || {};

    if (!phone || amount === undefined || amount === null) {
      return res.status(400).json({ message: 'Phone and amount are required' });
    }

    const normalised = normalisePhone(phone);
    if (!KENYAN_PHONE_RE.test(normalised)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > MAX_STK_AMOUNT) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (purpose !== undefined && !VALID_PURPOSES.has(purpose)) {
      return res.status(400).json({ message: 'Invalid purpose' });
    }
    if (email !== undefined && !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    // Ownership + price check for booking payments specifically — see
    // verifyBookingPayment() above for why this matters.
    if (purpose === 'booking_payment') {
      if (!bookingId || !email) {
        return res.status(400).json({ message: 'bookingId and email are required for booking payments' });
      }
      const verdict = await verifyBookingPayment(bookingId, email, numericAmount);
      if (!verdict.ok) {
        console.warn('Rejected booking_payment STK push:', verdict.reason);
        return res.status(403).json({ message: 'This payment could not be verified' });
      }
    }

    // Rate limit per phone (protects the person being called/charged) and
    // per IP (protects against a single abusive client hammering many
    // numbers). Both must pass.
    const ip = getClientIp(req);
    const [phoneOk, ipOk] = await Promise.all([
      checkRateLimit(`stk:phone:${normalised}`, 600, 5),   // 5 pushes / 10 min / phone
      checkRateLimit(`stk:ip:${ip}`, 3600, 20),             // 20 pushes / hour / IP
    ]);
    if (!phoneOk || !ipOk) {
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    const token = await getAccessToken();
    const timestamp = getTimestamp();
    const password = Buffer.from(SHORTCODE + PASSKEY + timestamp).toString('base64');

    const stkRes = await fetch(MPESA_BASE + '/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: numericAmount,
        PartyA: normalised,
        PartyB: SHORTCODE,
        PhoneNumber: normalised,
        CallBackURL: CALLBACK_URL,
        AccountReference: (accountReference || 'SplashPass').slice(0, 20),
        TransactionDesc: (transactionDesc || 'SplashPass Subscription').slice(0, 100)
      })
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode === '0') {
      if (purpose && email) {
        await recordPendingTransaction({
          checkoutRequestId: stkData.CheckoutRequestID,
          purpose,
          email,
          amount: numericAmount,
          bookingId,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'STK Push sent. Check your phone.',
        checkoutRequestID: stkData.CheckoutRequestID
      });
    } else {
      return res.status(400).json({
        success: false,
        message: stkData.errorMessage || stkData.ResponseDescription || 'STK Push failed'
      });
    }

  } catch (e) {
    console.error('STK error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
