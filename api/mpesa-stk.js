const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const PASSKEY = process.env.MPESA_PASSKEY;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://splashmain.vercel.app/api/mpesa-callback';
const MPESA_BASE = process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke';

// Used only to write the pending_transactions row right after a
// successful STK push response — same project, same table the callback
// (in splashmain) reads from. This is the customer app's own lightweight
// api/ folder, so it talks to Supabase directly here rather than via
// splashmain, consistent with how this file already worked before.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

// Best-effort — if this write fails, the STK push has already been sent
// to the customer's phone and can't be un-sent, so we still return success
// to the client. The callback falling back to "purpose unknown" for an
// untagged push (see mpesa-callback.js) is the safety net for that case,
// not a silent failure.
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  if (!CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY) {
    console.error('M-Pesa error: MPESA_CONSUMER_KEY/MPESA_CONSUMER_SECRET/MPESA_PASSKEY not configured');
    return res.status(503).json({ message: 'M-Pesa service is not configured' });
  }

  try {
    const {
      phone,
      amount,
      // New, optional fields — existing callers (subscription flow) that
      // don't pass these keep working exactly as before; the callback
      // treats an untagged push the same way it always has.
      purpose,       // 'subscription' | 'booking_payment' | 'wallet_topup'
      email,
      bookingId,
      accountReference,
      transactionDesc,
    } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ message: 'Phone and amount are required' });
    }

    // Normalise phone to 2547XXXXXXXX format
    let normalised = phone.replace(/\s+/g, '').replace(/^\+/, '');
    if (normalised.startsWith('07') || normalised.startsWith('01')) {
      normalised = '254' + normalised.slice(1);
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
        Amount: amount,
        PartyA: normalised,
        PartyB: SHORTCODE,
        PhoneNumber: normalised,
        CallBackURL: CALLBACK_URL,
        AccountReference: accountReference || 'SplashPass',
        TransactionDesc: transactionDesc || 'SplashPass Subscription'
      })
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode === '0') {
      // Tag this push so the callback knows what to do when the result
      // arrives. Only written when a purpose was actually specified —
      // existing callers that don't pass one behave exactly as before.
      if (purpose && email) {
        await recordPendingTransaction({
          checkoutRequestId: stkData.CheckoutRequestID,
          purpose,
          email,
          amount,
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
