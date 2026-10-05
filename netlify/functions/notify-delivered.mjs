// Renew — mark an order delivered, save the courier's confirmation photo, and
// email the customer a branded "your order was delivered" note with the photo.
// Admin-only: the caller's Supabase access token is verified and must belong to
// a profile with role 'admin'.
//
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, ORDER_FROM_EMAIL

import { readEnv, emailShell } from './_order.mjs'

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

const esc = (s = '') =>
  String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))

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
  const photoUrl = (body.photo_url || '').trim()
  if (!accessToken) return json(401, { error: 'Not authenticated.' })
  if (!orderId) return json(400, { error: 'Order is required.' })

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

  // 2. Load the order.
  let order
  try {
    const oRes = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?select=order_number,customer_name,customer_email&id=eq.${orderId}&limit=1`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    )
    order = oRes.ok ? (await oRes.json())[0] : null
  } catch (err) {
    console.error('Order fetch error:', err)
  }
  if (!order) return json(404, { error: 'Order not found.' })

  // 3. Update the order: delivered status + photo + timestamp.
  const deliveredAt = new Date().toISOString()
  try {
    const patch = { status: 'delivered', delivered_at: deliveredAt }
    if (photoUrl) patch.delivery_photo_url = photoUrl
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
    if (!upd.ok) return json(500, { error: `Could not update order: ${await upd.text()}` })
  } catch (err) {
    console.error('Order update error:', err)
    return json(500, { error: 'Could not update the order.' })
  }

  // 4. Email the customer.
  if (RESEND_API_KEY && order.customer_email) {
    const firstName = (order.customer_name || '').trim().split(/\s+/)[0] || 'there'
    const photoBlock = photoUrl
      ? `<p style="margin:18px 0;"><img src="${esc(photoUrl)}" alt="Delivery photo" style="max-width:100%;border-radius:12px;border:1px solid #e7ddce;" /></p>`
      : ''
    const html = emailShell(`
      <h2 style="font-weight:600;font-size:20px;margin:0 0 10px;">Your order was delivered, ${esc(firstName)}!</h2>
      <p style="color:#5c5f58;line-height:1.6;margin:0 0 14px;">
        Good news — order <strong>${esc(order.order_number)}</strong> has been delivered.
        ${photoUrl ? 'Here’s a photo confirmation from our courier:' : ''}
      </p>
      ${photoBlock}
      <p style="color:#8b8d87;line-height:1.6;margin:10px 0 0;font-size:13px;">
        If anything looks off, reply to this email or contact us right away.
      </p>
    `)
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: [order.customer_email],
          subject: `Your Renew order ${order.order_number} was delivered`,
          html,
        }),
      })
      if (!res.ok) console.error('Resend failed:', res.status, await res.text())
    } catch (err) {
      console.error('Resend error:', err)
    }
  }

  return json(200, { ok: true, delivered_at: deliveredAt, delivery_photo_url: photoUrl || null })
}
