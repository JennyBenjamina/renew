// Renew — mark an order's affiliate commission paid/unpaid and (when marking
// paid) email the sales rep that they've been paid. Admin-only.
//
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, ORDER_FROM_EMAIL

import { readEnv, emailShell, money } from './_order.mjs'

const COMMISSION_RATE = 0.3
const commissionFor = (total) => Math.ceil(Number(total || 0) * COMMISSION_RATE)

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
  const paid = body.paid === true
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

  // 2. Update the flag.
  try {
    const upd = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ commission_paid: paid }),
    })
    if (!upd.ok) return json(500, { error: `Could not update: ${await upd.text()}` })
  } catch (err) {
    console.error('Commission update error:', err)
    return json(500, { error: 'Could not update commission status.' })
  }

  // 3. Email the rep only when marking as paid.
  let emailed = false
  if (paid && RESEND_API_KEY) {
    try {
      const oRes = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?select=order_number,total,affiliate_id&id=eq.${orderId}&limit=1`,
        { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
      )
      const order = oRes.ok ? (await oRes.json())[0] : null
      if (order?.affiliate_id) {
        const aRes = await fetch(
          `${SUPABASE_URL}/rest/v1/affiliates?select=name,email&id=eq.${order.affiliate_id}&limit=1`,
          { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
        )
        const rep = aRes.ok ? (await aRes.json())[0] : null
        if (rep?.email) {
          const amount = money(commissionFor(order.total))
          const firstName = (rep.name || '').trim().split(/\s+/)[0] || 'there'
          const html = emailShell(`
            <h2 style="font-weight:600;font-size:20px;margin:0 0 10px;">You've been paid, ${esc(firstName)}!</h2>
            <p style="color:#5c5f58;line-height:1.6;margin:0 0 14px;">
              Your commission of <strong>${amount}</strong> for order
              <strong>${esc(order.order_number)}</strong> has been paid out. Thanks for
              driving the sale!
            </p>
            <p style="color:#8b8d87;line-height:1.6;margin:10px 0 0;font-size:13px;">
              You can see all your orders and payouts anytime on your affiliate dashboard at
              renewlabslv.com/affiliate/dashboard.
            </p>
          `)
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: FROM,
              to: [rep.email],
              subject: `You've been paid ${amount} — order ${order.order_number}`,
              html,
            }),
          })
          emailed = res.ok
          if (!res.ok) console.error('Resend failed:', res.status, await res.text())
        }
      }
    } catch (err) {
      console.error('Commission email error:', err)
    }
  }

  return json(200, { ok: true, commission_paid: paid, emailed })
}
