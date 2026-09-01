// Renew — shared order helpers (imported by payment functions; the leading
// underscore keeps Netlify from treating this file as its own endpoint).
//
// Centralizes: authoritative item pricing, affiliate discount resolution,
// Supabase insert, branded Resend emails, and the Meta Conversions API call.

import crypto from 'node:crypto'

export const money = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(n || 0)
  )

export const sha256 = (v) =>
  crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex')

export const round2 = (n) => Math.round(Number(n || 0) * 100) / 100

export function makeOrderNumber() {
  return (
    'RN-' +
    Date.now().toString(36).toUpperCase().slice(-6) +
    Math.floor(Math.random() * 90 + 10)
  )
}

/** Env bundle used across helpers. */
export function readEnv() {
  return {
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM: process.env.ORDER_FROM_EMAIL || 'Renew Orders <orders@renewlabslv.com>',
    NOTIFY: (
      process.env.ORDER_NOTIFY_EMAILS ||
      'abrahamleencoln@gmail.com,jennylee1989@gmail.com'
    )
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    META_PIXEL_ID: process.env.META_PIXEL_ID,
    META_CAPI_TOKEN: process.env.META_CAPI_TOKEN,
  }
}

/**
 * Re-price the cart from the authoritative `products` table so the amount we
 * charge can't be tampered with by the client. Returns { items, subtotal }.
 * Falls back to client-sent prices only if Supabase isn't configured.
 */
export async function verifyItems(env, clientItems) {
  const items = Array.isArray(clientItems) ? clientItems : []
  if (items.length === 0) return { items: [], subtotal: 0, error: 'Your cart is empty.' }

  const { SUPABASE_URL, SERVICE_KEY } = env
  if (!SUPABASE_URL || !SERVICE_KEY) {
    // No backend to verify against — trust the client (dev fallback).
    const priced = items.map((i) => ({
      id: i.id,
      name: i.name,
      qty: Math.max(1, Number(i.qty) || 1),
      price: Number(i.price) || 0,
    }))
    return { items: priced, subtotal: round2(priced.reduce((s, i) => s + i.price * i.qty, 0)) }
  }

  try {
    const ids = [...new Set(items.map((i) => i.id))]
    const inList = ids.map((id) => `"${String(id).replace(/"/g, '')}"`).join(',')
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,name,price&id=in.(${encodeURIComponent(inList)})`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    )
    if (!res.ok) return { items: [], subtotal: 0, error: 'Could not verify products.' }
    const rows = await res.json()
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]))

    const priced = []
    for (const i of items) {
      const p = byId[i.id]
      if (!p) return { items: [], subtotal: 0, error: `Unknown product: ${i.id}` }
      priced.push({
        id: p.id,
        name: p.name,
        qty: Math.max(1, Number(i.qty) || 1),
        price: Number(p.price),
      })
    }
    return { items: priced, subtotal: round2(priced.reduce((s, i) => s + i.price * i.qty, 0)) }
  } catch (err) {
    console.error('verifyItems error:', err)
    return { items: [], subtotal: 0, error: 'Could not verify products.' }
  }
}

/** Resolve a referral/discount code to a rep + discount amount (server-side). */
export async function resolveAffiliate(env, referralCodeRaw, subtotal) {
  let referralCode = (referralCodeRaw || '').trim() || null
  let affiliateId = null
  let discount = 0
  const { SUPABASE_URL, SERVICE_KEY } = env
  if (referralCode && SUPABASE_URL && SERVICE_KEY) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/affiliates?select=id,code,discount_percent,active` +
          `&code=ilike.${encodeURIComponent(referralCode)}&active=eq.true&limit=1`,
        { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
      )
      const a = res.ok ? (await res.json())[0] : null
      if (a) {
        affiliateId = a.id
        referralCode = a.code
        discount = round2(subtotal * (Number(a.discount_percent) / 100))
      } else {
        referralCode = null
      }
    } catch (err) {
      console.error('resolveAffiliate error:', err)
      referralCode = null
    }
  }
  return { referralCode, affiliateId, discount }
}

/** Insert an order row (service role). Returns { recorded, dbError }. */
export async function recordOrder(env, orderRow) {
  const { SUPABASE_URL, SERVICE_KEY } = env
  if (!SUPABASE_URL) return { recorded: false, dbError: 'SUPABASE_URL not set' }
  if (!SERVICE_KEY) return { recorded: false, dbError: 'SUPABASE_SERVICE_ROLE_KEY not set' }
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
    if (res.ok) return { recorded: true, dbError: null }
    const dbError = `insert ${res.status}: ${(await res.text()).slice(0, 300)}`
    console.error('Supabase insert failed:', dbError)
    return { recorded: false, dbError }
  } catch (err) {
    console.error('Supabase insert error:', err)
    return { recorded: false, dbError: 'fetch error: ' + (err?.message || String(err)) }
  }
}

export const emailShell = (inner) => `
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

function itemsTableHtml({ items, subtotal, discount, total, referralCode }) {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:7px 0;border-bottom:1px solid #f2ece2;">${i.qty}× ${i.name}</td>` +
        `<td style="padding:7px 0;text-align:right;border-bottom:1px solid #f2ece2;">${money(i.price * i.qty)}</td></tr>`
    )
    .join('')
  return `
    <table style="width:100%;font-size:14px;border-collapse:collapse;">${rows}</table>
    ${
      Number(discount) > 0
        ? `<p style="text-align:right;font-size:13px;color:#5c5f58;margin:10px 0 0;">Subtotal: ${money(subtotal)}</p>
           <p style="text-align:right;font-size:13px;color:#6f7d53;margin:2px 0 0;">Discount${referralCode ? ` (${referralCode})` : ''}: −${money(discount)}</p>`
        : ''
    }
    <p style="text-align:right;font-size:16px;font-weight:600;margin:8px 0 0;">Total: ${money(total)}</p>`
}

/** Send the owner notification + customer confirmation via Resend. */
export async function sendOrderEmails(env, o) {
  const { RESEND_API_KEY, FROM, NOTIFY } = env
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — order emails not sent.')
    return
  }
  const PICKUP_PHONE = '(424) 877-5528'
  const firstName = (o.customer.name || '').trim().split(/\s+/)[0] || 'there'
  const table = itemsTableHtml(o)
  const paid = o.paymentStatus === 'paid'
  const payLine = paid
    ? 'Payment received online — your card has been charged.'
    : 'No payment was taken online — you’ll pay on delivery.'

  const ownerHtml = emailShell(`
    <h2 style="font-weight:600;font-size:20px;margin:0 0 6px;">New order — ${o.orderNumber}</h2>
    <p style="color:#5c5f58;margin:0 0 16px;">${paid ? 'A customer paid online for delivery.' : 'A customer submitted an order for delivery.'}</p>
    <h3 style="margin:18px 0 6px;font-size:15px;">Customer</h3>
    <table style="width:100%;font-size:14px;">
      <tr><td style="color:#8b8d87;padding:4px 0;">Name</td><td style="text-align:right;">${o.customer.name}</td></tr>
      <tr><td style="color:#8b8d87;padding:4px 0;">Email</td><td style="text-align:right;">${o.customer.email}</td></tr>
      <tr><td style="color:#8b8d87;padding:4px 0;">Phone</td><td style="text-align:right;">${o.customer.phone}</td></tr>
      ${o.customer.note ? `<tr><td style="color:#8b8d87;padding:4px 0;vertical-align:top;">Note</td><td style="text-align:right;">${o.customer.note}</td></tr>` : ''}
    </table>
    <h3 style="margin:20px 0 6px;font-size:15px;">Items</h3>
    ${table}
    <p style="color:${paid ? '#6f7d53' : '#8b8d87'};font-size:13px;margin:12px 0 0;">${payLine}</p>
    ${o.referralCode ? `<p style="color:#6f7d53;font-size:13px;margin:6px 0 0;">Referred by code: <strong>${o.referralCode}</strong></p>` : ''}
  `)

  const customerHtml = emailShell(`
    <h2 style="font-weight:600;font-size:20px;margin:0 0 10px;">Thanks for your order, ${firstName}!</h2>
    <p style="color:#5c5f58;line-height:1.6;margin:0 0 14px;">
      We’ve received your order <strong>${o.orderNumber}</strong> for delivery.
      A member of our team will reach out <strong>within 24 hours</strong> to arrange delivery.
    </p>
    <h3 style="margin:18px 0 6px;font-size:15px;">Your order</h3>
    ${table}
    <p style="color:#5c5f58;line-height:1.6;margin:16px 0 6px;">${payLine}</p>
    <p style="color:#5c5f58;line-height:1.6;margin:0;">
      Questions? Call or text us at <a href="tel:+14248775528" style="color:#a4605a;font-weight:600;">${PICKUP_PHONE}</a>.
    </p>
  `)

  const send = async (to, subject, html, replyTo) => {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, to, subject, html, reply_to: replyTo }),
      })
      if (!res.ok) console.error('Resend failed:', res.status, await res.text())
    } catch (err) {
      console.error('Resend error:', err)
    }
  }

  await Promise.all([
    send(NOTIFY, `New order ${o.orderNumber} — ${o.customer.name}`, ownerHtml, o.customer.email),
    send([o.customer.email], `Your Renew order ${o.orderNumber}`, customerHtml, NOTIFY[0]),
  ])
}

/** Server-side Meta Conversions API Purchase (optional, env-gated). */
export async function metaCapiPurchase(env, { orderNumber, customer, items, total }) {
  const { META_PIXEL_ID, META_CAPI_TOKEN } = env
  if (!META_PIXEL_ID || !META_CAPI_TOKEN) return
  try {
    await fetch(
      `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [
            {
              event_name: 'Purchase',
              event_time: Math.floor(Date.now() / 1000),
              action_source: 'website',
              event_id: orderNumber,
              user_data: {
                em: [sha256(customer.email)],
                ph: [sha256((customer.phone || '').replace(/\D/g, ''))],
              },
              custom_data: {
                currency: 'USD',
                value: total,
                content_ids: items.map((i) => i.id),
                content_type: 'product',
                order_id: orderNumber,
              },
            },
          ],
        }),
      }
    )
  } catch (err) {
    console.error('Meta CAPI error:', err)
  }
}
