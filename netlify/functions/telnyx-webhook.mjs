// Renew — Telnyx messaging webhook receiver.
//
// Point your Telnyx Messaging Profile "Webhook URL" at:
//   https://renewlabslv.com/.netlify/functions/telnyx-webhook
//
// What it does:
//   • Verifies Telnyx's Ed25519 signature (when TELNYX_PUBLIC_KEY is set).
//   • On an inbound reply (message.received): detects STOP-style opt-outs and
//     START-style opt-ins, and maintains a suppression list in Supabase so you
//     never text someone who opted out. Also logs the reply.
//   • On delivery receipts (message.sent / message.finalized): logs the status.
//   • Always returns 2xx quickly so Telnyx doesn't retry.
//
// Required Netlify env (shared with orders):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Optional but recommended:
//   TELNYX_PUBLIC_KEY   Portal → Account → Public Key (base64 Ed25519). When set,
//                       requests with a bad/missing signature are rejected (401).

import crypto from 'node:crypto'

const OK = (body = { ok: true }) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

// CTIA standard keywords (case-insensitive, first word of the reply).
const OPT_OUT = new Set(['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit'])
const OPT_IN = new Set(['start', 'yes', 'unstop'])

const env = () => ({
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  PUBLIC_KEY: process.env.TELNYX_PUBLIC_KEY,
})

/** Verify Telnyx's Ed25519 signature over `${timestamp}|${rawBody}`. */
function verifySignature({ publicKeyB64, timestamp, rawBody, signatureB64 }) {
  if (!publicKeyB64) return { ok: true, skipped: true } // not configured → skip
  if (!timestamp || !signatureB64) return { ok: false }
  // Reject anything older than 5 minutes (replay protection).
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > 300) return { ok: false }
  try {
    const rawKey = Buffer.from(publicKeyB64, 'base64')
    if (rawKey.length !== 32) return { ok: false }
    // Wrap the raw 32-byte key in the Ed25519 SPKI DER prefix.
    const der = Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), rawKey])
    const key = crypto.createPublicKey({ key: der, format: 'der', type: 'spki' })
    const signed = Buffer.from(`${timestamp}|${rawBody}`)
    const ok = crypto.verify(null, signed, key, Buffer.from(signatureB64, 'base64'))
    return { ok }
  } catch (err) {
    console.error('Telnyx signature verify error:', err.message)
    return { ok: false }
  }
}

async function sbInsert(e, table, row, { upsert } = {}) {
  if (!e.SUPABASE_URL || !e.SERVICE_KEY) {
    console.warn('Supabase not configured — skipping', table, 'write')
    return
  }
  try {
    const res = await fetch(`${e.SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: e.SERVICE_KEY,
        Authorization: `Bearer ${e.SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: upsert ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal',
      },
      body: JSON.stringify(row),
    })
    if (!res.ok) console.error(`${table} write ${res.status}:`, (await res.text()).slice(0, 200))
  } catch (err) {
    console.error(`${table} write error:`, err.message)
  }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }

  const e = env()
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : event.body || ''

  const h = event.headers || {}
  const sig = verifySignature({
    publicKeyB64: e.PUBLIC_KEY,
    timestamp: h['telnyx-timestamp'],
    rawBody,
    signatureB64: h['telnyx-signature-ed25519'],
  })
  if (!sig.ok) return { statusCode: 401, body: 'Invalid signature' }

  let body
  try {
    body = JSON.parse(rawBody || '{}')
  } catch {
    return OK({ ok: false, error: 'bad json' })
  }

  const data = body.data || body
  const eventType = data.event_type || data.eventType
  const p = data.payload || {}

  // --- Inbound reply -------------------------------------------------------
  if (eventType === 'message.received') {
    const from = p.from?.phone_number || p.from || null
    const to = Array.isArray(p.to) ? p.to[0]?.phone_number : p.to?.phone_number || p.to || null
    const text = (p.text || '').trim()
    const firstWord = text.toLowerCase().split(/\s+/)[0] || ''

    await sbInsert(e, 'sms_inbound', {
      telnyx_message_id: p.id || data.id || null,
      from_number: from,
      to_number: to,
      body: text,
      received_at: data.occurred_at || new Date().toISOString(),
    })

    if (from && OPT_OUT.has(firstWord)) {
      await sbInsert(
        e,
        'sms_opt_outs',
        {
          phone_number: from,
          active: true,
          keyword: firstWord,
          opted_out_at: new Date().toISOString(),
          opted_in_at: null,
        },
        { upsert: true }
      )
      console.log('SMS opt-out recorded:', from)
    } else if (from && OPT_IN.has(firstWord)) {
      await sbInsert(
        e,
        'sms_opt_outs',
        {
          phone_number: from,
          active: false,
          keyword: firstWord,
          opted_in_at: new Date().toISOString(),
        },
        { upsert: true }
      )
      console.log('SMS opt-in / resubscribe:', from)
    }

    return OK()
  }

  // --- Delivery receipts ---------------------------------------------------
  if (eventType === 'message.sent' || eventType === 'message.finalized') {
    const status = Array.isArray(p.to) ? p.to[0]?.status : p.status
    console.log('Telnyx DLR', eventType, 'id', p.id || data.id, 'status', status)
    return OK()
  }

  // Unknown/other event — ack so Telnyx doesn't retry.
  console.log('Telnyx event (unhandled):', eventType)
  return OK()
}
