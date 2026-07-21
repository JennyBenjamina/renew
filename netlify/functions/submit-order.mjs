// Renew — order submission (local pickup, no payment).
// Records the order in Supabase (service role) and emails the store owners
// via Resend. Runs server-side on Netlify so secret keys are never exposed.
//
// Required Netlify environment variables (Site settings → Environment):
//   SUPABASE_URL                 e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    Supabase → Project Settings → API → service_role (SECRET)
//   RESEND_API_KEY               Resend API key (re_...)
// Optional overrides:
//   ORDER_FROM_EMAIL             default: Renew Orders <orders@renewlabslv.com>
//   ORDER_NOTIFY_EMAILS          comma-separated; default: the two owner emails

const money = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(n || 0)
  )

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM = process.env.ORDER_FROM_EMAIL || 'Renew Orders <orders@renewlabslv.com>'
  const NOTIFY = (
    process.env.ORDER_NOTIFY_EMAILS ||
    'abrahamleencoln@gmail.com,jennylee1989@gmail.com'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON.' })
  }

  const customer = payload.customer || {}
  const items = Array.isArray(payload.items) ? payload.items : []

  if (!customer.name || !customer.email || !customer.phone) {
    return json(400, { error: 'Name, email, and phone are required.' })
  }
  if (items.length === 0) {
    return json(400, { error: 'Your cart is empty.' })
  }

  const total = items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0)
  const orderNumber =
    'RN-' + Date.now().toString(36).toUpperCase().slice(-6) +
    Math.floor(Math.random() * 90 + 10)

  const orderRow = {
    order_number: orderNumber,
    user_id: payload.user_id || null,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    note: customer.note || null,
    fulfillment: 'local_pickup',
    status: 'pending',
    total,
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      qty: Number(i.qty),
      price: Number(i.price),
    })),
  }

  // 1. Record the order in Supabase (service role bypasses RLS).
  if (SUPABASE_URL && SERVICE_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(orderRow),
      })
      if (!res.ok) {
        const t = await res.text()
        console.error('Supabase insert failed:', res.status, t)
      }
    } catch (err) {
      console.error('Supabase insert error:', err)
    }
  } else {
    console.warn('Supabase env not set — order not recorded to database.')
  }

  // 2. Email the store owners via Resend.
  const rows = orderRow.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;">${i.qty}× ${i.name}</td>` +
        `<td style="padding:6px 0;text-align:right;">${money(i.price * i.qty)}</td></tr>`
    )
    .join('')

  const html = `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#333330;">
    <h2 style="font-weight:600;">New pickup order — ${orderNumber}</h2>
    <p style="color:#5c5f58;">A customer submitted an order for local pickup.</p>
    <h3 style="margin:20px 0 6px;font-size:15px;">Customer</h3>
    <table style="width:100%;font-size:14px;">
      <tr><td style="color:#8b8d87;padding:4px 0;">Name</td><td style="text-align:right;">${customer.name}</td></tr>
      <tr><td style="color:#8b8d87;padding:4px 0;">Email</td><td style="text-align:right;">${customer.email}</td></tr>
      <tr><td style="color:#8b8d87;padding:4px 0;">Phone</td><td style="text-align:right;">${customer.phone}</td></tr>
      ${customer.note ? `<tr><td style="color:#8b8d87;padding:4px 0;">Note</td><td style="text-align:right;">${customer.note}</td></tr>` : ''}
    </table>
    <h3 style="margin:20px 0 6px;font-size:15px;">Items</h3>
    <table style="width:100%;font-size:14px;border-top:1px solid #eee4d8;border-bottom:1px solid #eee4d8;">
      ${rows}
    </table>
    <p style="text-align:right;font-size:16px;font-weight:600;margin-top:12px;">Total: ${money(total)}</p>
    <p style="color:#8b8d87;font-size:12px;margin-top:20px;">Payment collected in person at pickup. For research use only.</p>
  </div>`

  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to: NOTIFY,
          reply_to: customer.email,
          subject: `New pickup order ${orderNumber} — ${customer.name}`,
          html,
        }),
      })
      if (!res.ok) {
        const t = await res.text()
        console.error('Resend email failed:', res.status, t)
      }
    } catch (err) {
      console.error('Resend email error:', err)
    }
  } else {
    console.warn('RESEND_API_KEY not set — owner email not sent.')
  }

  return json(200, { ok: true, order_number: orderNumber, total })
}
