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

  // 2. Emails via Resend — branded shell with the Renew logo.
  const PICKUP_PHONE = '(424) 877-5528'
  const firstName = (customer.name || '').trim().split(/\s+/)[0] || 'there'

  const itemRows = orderRow.items
    .map(
      (i) =>
        `<tr><td style="padding:7px 0;border-bottom:1px solid #f2ece2;">${i.qty}× ${i.name}</td>` +
        `<td style="padding:7px 0;text-align:right;border-bottom:1px solid #f2ece2;">${money(i.price * i.qty)}</td></tr>`
    )
    .join('')

  const shell = (inner) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe7;margin:0;padding:28px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7ddce;border-radius:16px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;">
        <tr><td align="center" style="padding:30px 40px 4px;">
          <img src="https://renewlabslv.com/logo-mark.png" alt="Renew" width="150" style="display:block;width:150px;max-width:55%;height:auto;" />
        </td></tr>
        <tr><td style="padding:10px 40px 26px;color:#333330;">${inner}</td></tr>
        <tr><td style="padding:0 40px;"><div style="border-top:1px solid #eee4d8;"></div></td></tr>
        <tr><td style="padding:16px 40px 28px;">
          <p style="margin:0;font-size:11px;line-height:1.6;color:#a0a29c;text-align:center;">Renew — research compounds synthesized for precision.<br />For laboratory research use only. Not for human consumption.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>`

  const itemsTable = `
    <table style="width:100%;font-size:14px;border-collapse:collapse;">${itemRows}</table>
    <p style="text-align:right;font-size:16px;font-weight:600;margin:12px 0 0;">Total: ${money(total)}</p>`

  // Owner notification
  const ownerHtml = shell(`
    <h2 style="font-weight:600;font-size:20px;margin:0 0 6px;">New pickup order — ${orderNumber}</h2>
    <p style="color:#5c5f58;margin:0 0 16px;">A customer submitted an order for local pickup.</p>
    <h3 style="margin:18px 0 6px;font-size:15px;">Customer</h3>
    <table style="width:100%;font-size:14px;">
      <tr><td style="color:#8b8d87;padding:4px 0;">Name</td><td style="text-align:right;">${customer.name}</td></tr>
      <tr><td style="color:#8b8d87;padding:4px 0;">Email</td><td style="text-align:right;">${customer.email}</td></tr>
      <tr><td style="color:#8b8d87;padding:4px 0;">Phone</td><td style="text-align:right;">${customer.phone}</td></tr>
      ${customer.note ? `<tr><td style="color:#8b8d87;padding:4px 0;vertical-align:top;">Note</td><td style="text-align:right;">${customer.note}</td></tr>` : ''}
    </table>
    <h3 style="margin:20px 0 6px;font-size:15px;">Items</h3>
    ${itemsTable}
    <p style="color:#8b8d87;font-size:12px;margin-top:18px;">Payment collected in person at pickup. Reply to this email to reach the customer.</p>
  `)

  // Customer confirmation
  const customerHtml = shell(`
    <h2 style="font-weight:600;font-size:20px;margin:0 0 10px;">Thanks for your order, ${firstName}!</h2>
    <p style="color:#5c5f58;line-height:1.6;margin:0 0 14px;">
      We’ve received your order <strong>${orderNumber}</strong> for local pickup.
      A member of our team will reach out <strong>within 24 hours</strong> to
      arrange a convenient time to meet in person.
    </p>
    <h3 style="margin:18px 0 6px;font-size:15px;">Your order</h3>
    ${itemsTable}
    <p style="color:#5c5f58;line-height:1.6;margin:16px 0 6px;">
      No payment was taken online — you’ll pay when you collect your order.
    </p>
    <p style="color:#5c5f58;line-height:1.6;margin:0;">
      Questions in the meantime? Call or text us at
      <a href="tel:+14248775528" style="color:#a4605a;font-weight:600;">${PICKUP_PHONE}</a>.
    </p>
  `)

  async function sendEmail(to, subject, html, replyTo) {
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — email not sent to', to)
      return
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM, to, subject, html, reply_to: replyTo }),
      })
      if (!res.ok) console.error('Resend failed:', res.status, await res.text())
    } catch (err) {
      console.error('Resend error:', err)
    }
  }

  // Owner email (reply-to customer) + customer confirmation (reply-to owner).
  await Promise.all([
    sendEmail(
      NOTIFY,
      `New pickup order ${orderNumber} — ${customer.name}`,
      ownerHtml,
      customer.email
    ),
    sendEmail(
      [customer.email],
      `Your Renew order ${orderNumber} — we’ll be in touch`,
      customerHtml,
      NOTIFY[0]
    ),
  ])

  return json(200, { ok: true, order_number: orderNumber, total })
}
