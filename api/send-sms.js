const AT_USERNAME = process.env.AT_USERNAME || 'sandbox'
const AT_API_KEY = process.env.AT_API_KEY
const AT_URL =
  process.env.AT_MESSAGING_URL ||
  'https://api.sandbox.africastalking.com/version1/messaging'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://splashmain.vercel.app')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const KENYAN_PHONE_RE = /^(?:\+254|254|0)(7|1)\d{8}$/

// Fixed, server-side message templates. The caller sends structured data
// (a `type` + the booking details), never raw text — this is what
// actually closes the "open SMS relay" hole, not just rate limiting it.
// Previously the endpoint accepted an arbitrary `message` string from
// whoever called it, which meant anyone who found the endpoint could send
// any text they wanted, to any number, on this project's Africa's Talking
// bill and "SplashPass" sender ID (a smishing/phishing vector as well as
// a billing-drain one). If you need a new notification type, add a
// template here rather than loosening this back to free text.
const TEMPLATES = {
  booking_request: ({ pointName, date, slotTime }) =>
    `SplashPass: Your booking request at ${pointName} for ${date} ${slotTime} has been sent. We'll notify you once the operator responds.`,
  booking_confirmed: ({ pointName, date, slotTime }) =>
    `SplashPass Booking Confirmed! Location: ${pointName} | Date: ${date} | Time: ${slotTime}. Show QR code to attendant.`,
}

const MAX_FIELD_LEN = 100

function normalisePhone(phone) {
  let normalised = String(phone).replace(/\s+/g, '')
  if (normalised.startsWith('07') || normalised.startsWith('01')) {
    normalised = '+254' + normalised.slice(1)
  } else if (normalised.startsWith('254')) {
    normalised = '+' + normalised
  } else if (!normalised.startsWith('+')) {
    normalised = '+254' + normalised
  }
  return normalised
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim()
  return req.socket?.remoteAddress || 'unknown'
}

async function checkRateLimit(bucketKey, windowSeconds, maxRequests) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return false // fail closed
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
    })
    if (!res.ok) return false
    const rows = await res.json()
    return Boolean(rows?.[0]?.allowed)
  } catch (e) {
    console.error('rate limit check failed:', e.message)
    return false
  }
}

export default async function handler(req, res) {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ message: 'Origin not allowed' })
  }

  if (!AT_API_KEY) {
    console.error('SMS error: AT_API_KEY is not configured')
    return res.status(503).json({ message: 'SMS service is not configured' })
  }

  try {
    const { phone, type, pointName, date, slotTime } = req.body || {}

    if (!phone || !KENYAN_PHONE_RE.test(String(phone).replace(/\s+/g, ''))) {
      return res.status(400).json({ message: 'Invalid phone number' })
    }

    const template = TEMPLATES[type]
    if (!template) {
      return res.status(400).json({ message: 'Invalid notification type' })
    }

    for (const field of [pointName, date, slotTime]) {
      if (typeof field !== 'string' || field.length === 0 || field.length > MAX_FIELD_LEN) {
        return res.status(400).json({ message: 'Invalid booking details' })
      }
    }

    const normalised = normalisePhone(phone)
    const ip = getClientIp(req)
    const [phoneOk, ipOk] = await Promise.all([
      checkRateLimit(`sms:phone:${normalised}`, 600, 5),  // 5 texts / 10 min / phone
      checkRateLimit(`sms:ip:${ip}`, 3600, 30),            // 30 texts / hour / IP
    ])
    if (!phoneOk || !ipOk) {
      return res.status(429).json({ message: 'Too many requests. Please try again later.' })
    }

    const message = template({ pointName, date, slotTime })

    const params = new URLSearchParams()
    params.append('username', AT_USERNAME)
    params.append('to', normalised)
    params.append('message', message)
    params.append('from', process.env.AT_SENDER_ID || 'SplashPass')

    const response = await fetch(AT_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        apiKey: AT_API_KEY,
      },
      body: params.toString(),
    })

    const data = await response.json()
    const recipient = data.SMSMessageData?.Recipients?.[0]

    if (recipient && recipient.statusCode === 101) {
      return res.status(200).json({ success: true, message: 'SMS sent' })
    }

    const errMsg = recipient?.status || 'SMS failed'
    return res.status(200).json({ success: false, message: errMsg })
  } catch (e) {
    console.error('SMS error:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
