// Renew — mark an order shipped, save its tracking number, and email the
// customer a branded "your order is on the way" note. Admin-only: the caller's
// Supabase access token is verified and must belong to a profile with role
// 'admin' before anything happens.
//
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, ORDER_FROM_EMAIL

import { readEnv, emailShell } from './_order.mjs'

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

const esc = (s = '') =>
  String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))

const CARRIERS = {
  usps: { name: 'USPS', url: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}` },
  ups: { name: 'UPS', url: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}` },
  fedex: { name: 'FedEx', url: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}` },
  dhl: { name: 'DHL', url: (n) => `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encodeURIComponent(n)}` },
  other: { name: 'Carrier', url: () => null },
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
  const orderId = body.order_id
  const carrierKey = (body.carrier || 'other').toLowerCase()
  const tracking = (body.tracking_number || '').trim()
  const carrier = CARRIERS[carrierKey] || CARRIERS.other

  if (!accessToken) return json(401, { error: 'Not authenticated.' })
  if (!orderId || !tracking) return json(400, { error: 'Order and tracking number are required.' })

  const env = readEnv()
  const { SUPABASE_URL, SERVICE_KEY, RESEND_API_KEY, FROM } = env
  if (!SUPABASE_URL || !SERVICE_KEY) return json(500, { error: 'Server not configured.' })

  // 1. Verify the caller is a signed-in admin.
  try {
    const uRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${accessToken}` },
    })
    if (!uRes.ok) return json(401, { error: 'Session expired — sign in again.' })
    const uid = (await uRes.json())?.id
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

  // 2. Load the order (authoritative details).
  let order
  try {
    const oRes = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?select=order_number,customer_name,customer_email,items&id=eq.${orderId}&limit=1`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    )
    order = oRes.ok ? (await oRes.json())[0] : null
  } catch (err) {
    console.error('Order fetch error:', err)
  }
  if (!order) return json(404, { error: 'Order not found.' })

  // 3. Update the order: tracking + carrier + shipped status.
  try {
    const patch = {
      carrier: carrier.name,
      tracking_number: tracking,
      shipped_at: new Date().toISOString(),
      status: 'shipped',
    }
    const upd = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    })
    if (!upd.ok) {
      return json(500, { error: `Could not update order: ${await upd.text()}` })
    }
  } catch (err) {
    console.error('Order update error:', err)
    return json(500, { error: 'Could not update the order.' })
  }

  // 4. Email the customer.
  if (RESEND_API_KEY && order.customer_email) {
    const firstName = (order.customer_name || '').trim().split(/\s+/)[0] || 'there'
    const url = carrier.url(tracking)
    const trackBtn = url
      ? `<p style="margin:18px 0;"><a href="${url}" style="display:inline-block;background:#8b8d87;color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-weight:600;font-size:14px;">Track your package →</a></p>`
      : ''
    const html = emailShell(`
      <h2 style="font-weight:600;font-size:20px;margin:0 0 10px;">Your order is on the way, ${esc(firstName)}!</h2>
      <p style="color:#5c5f58;line-height:1.6;margin:0 0 14px;">
        Good news — order <strong>${esc(order.order_number)}</strong> has shipped
        via <strong>${esc(carrier.name)}</strong>.
      </p>
      <table style="width:100%;font-size:14px;">
        <tr><td style="color:#8b8d87;padding:4px 0;">Carrier</td><td style="text-align:right;">${esc(carrier.name)}</td></tr>
        <tr><td style="color:#8b8d87;padding:4px 0;">Tracking #</td><td style="text-align:right;font-family:monospace;">${esc(tracking)}</td></tr>
      </table>
      ${trackBtn}
      <p style="color:#8b8d87;line-height:1.6;margin:6px 0 0;font-size:13px;">
        Tracking can take a few hours to activate after the label is created.
      </p>
    `)
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: [order.customer_email],
          subject: `Your Renew order ${order.order_number} has shipped`,
          html,
        }),
      })
      if (!res.ok) console.error('Resend failed:', res.status, await res.text())
    } catch (err) {
      console.error('Resend error:', err)
    }
  }

  return json(200, { ok: true, carrier: carrier.name, tracking_number: tracking })
}
