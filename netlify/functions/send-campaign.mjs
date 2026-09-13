// Renew — send an SMS marketing campaign via Telnyx to all past customers.
// Admin-only: the caller's Supabase access token is verified and must belong to
// a profile with role 'admin'. Recipients are gathered server-side (distinct
// customer phone numbers from orders), the STOP opt-out list is applied, and a
// compliant opt-out line is appended. Results are logged to sms_campaigns.
//
// Required Netlify env:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   TELNYX_API_KEY        Telnyx API key (KEY…)
//   TELNYX_FROM_NUMBER    Your Telnyx sending number, E.164 (+17029319551)
// Optional:
//   TELNYX_MESSAGING_PROFILE_ID

import { readEnv } from './_order.mjs'

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

const MAX_RECIPIENTS = 500 // safety cap per send (stay within function time limits)
const CONCURRENCY = 8

/** Normalize a US phone to E.164 (+1XXXXXXXXXX), or null if it can't be. */
function toE164(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  if (s.startsWith('+')) {
    const d = s.replace(/[^\d]/g, '')
    return d.length >= 11 && d.length <= 15 ? `+${d}` : null
  }
  const d = s.replace(/\D/g, '')
  if (d.length === 10) return `+1${d}`
  if (d.length === 11 && d.startsWith('1')) return `+${d}`
  return null
}

async function sbGet(env, path) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: env.SERVICE_KEY, Authorization: `Bearer ${env.SERVICE_KEY}` },
  })
  return res.ok ? res.json() : []
}

/** Run tasks with limited concurrency. */
async function pool(items, limit, worker) {
  const results = []
  let i = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      results[idx] = await worker(items[idx], idx)
    }
  })
  await Promise.all(runners)
  return results
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON.' })
  }

  const accessToken = body.access_token
  const message = (body.message || '').trim()
  const appendStop = body.append_stop !== false // default true
  if (!accessToken) return json(401, { error: 'Not authenticated.' })
  if (!message) return json(400, { error: 'Message is required.' })
  if (message.length > 1500) return json(400, { error: 'Message is too long.' })

  const env = readEnv()
  const { SUPABASE_URL, SERVICE_KEY } = env
  const TELNYX_API_KEY = process.env.TELNYX_API_KEY
  const FROM = process.env.TELNYX_FROM_NUMBER
  const PROFILE_ID = process.env.TELNYX_MESSAGING_PROFILE_ID
  if (!SUPABASE_URL || !SERVICE_KEY) return json(500, { error: 'Server not configured.' })
  if (!TELNYX_API_KEY || !FROM) {
    return json(503, { error: 'Texting is not configured yet (Telnyx key/number missing).' })
  }

  // 1. Verify the caller is a signed-in admin.
  let uid = null
  try {
    const uRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${accessToken}` },
    })
    if (!uRes.ok) return json(401, { error: 'Session expired — sign in again.' })
    uid = (await uRes.json())?.id
    const pRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=role&id=eq.${uid}&limit=1`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    )
    const role = pRes.ok ? (await pRes.json())[0]?.role : null
    if (role !== 'admin') return json(403, { error: 'Admins only.' })
  } catch (err) {
    console.error('Auth check error:', err)
    return json(500, { error: 'Could not verify access.' })
  }

  // 2. Build the recipient list: consented customers, distinct, minus opt-outs.
  const [orders, optOuts] = await Promise.all([
    sbGet(env, 'orders?select=customer_phone&sms_consent=eq.true'),
    sbGet(env, 'sms_opt_outs?select=phone_number&active=eq.true'),
  ])
  const suppressed = new Set((optOuts || []).map((o) => toE164(o.phone_number)).filter(Boolean))

  const recipients = []
  const seen = new Set()
  for (const o of orders || []) {
    const p = toE164(o.customer_phone)
    if (!p || seen.has(p) || suppressed.has(p)) continue
    seen.add(p)
    recipients.push(p)
  }

  if (recipients.length === 0) {
    return json(200, { ok: true, sent: 0, failed: 0, total: 0, note: 'No eligible recipients.' })
  }
  const capped = recipients.slice(0, MAX_RECIPIENTS)

  // 3. Compose the final text (append opt-out line for compliance).
  const hasStop = /\bstop\b/i.test(message)
  const text = appendStop && !hasStop ? `${message}\n\nReply STOP to opt out.` : message

  // 4. Send via Telnyx with limited concurrency.
  let sent = 0
  const failures = []
  await pool(capped, CONCURRENCY, async (to) => {
    try {
      const res = await fetch('https://api.telnyx.com/v2/messages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TELNYX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to,
          text,
          ...(PROFILE_ID ? { messaging_profile_id: PROFILE_ID } : {}),
        }),
      })
      if (res.ok) {
        sent++
      } else {
        const detail = (await res.text()).slice(0, 200)
        failures.push({ to, error: `${res.status}: ${detail}` })
      }
    } catch (err) {
      failures.push({ to, error: err?.message || 'send error' })
    }
  })

  // 5. Log the campaign (best-effort).
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/sms_campaigns`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        message: text,
        recipient_count: capped.length,
        sent_count: sent,
        failed_count: failures.length,
        created_by: uid,
      }),
    })
  } catch (err) {
    console.error('Campaign log error:', err.message)
  }

  return json(200, {
    ok: true,
    total: recipients.length,
    attempted: capped.length,
    sent,
    failed: failures.length,
    truncated: recipients.length > capped.length,
    failures: failures.slice(0, 20),
  })
}
