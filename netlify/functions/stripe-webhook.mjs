// Renew — Stripe webhook. Records the paid order once Stripe confirms payment.
//
// Point a Stripe webhook endpoint (Dashboard → Developers → Webhooks) at:
//   https://renewlabslv.com/.netlify/functions/stripe-webhook
// subscribed to: payment_intent.succeeded  (embedded Payment Element flow)
//   and optionally checkout.session.completed (hosted Checkout flow)
//
// Required Netlify env:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (whsec_…)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY

import Stripe from 'stripe'
import {
  readEnv,
  recordOrder,
  sendOrderEmails,
  metaCapiPurchase,
} from './_order.mjs'

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Has an order with this number already been recorded? (idempotency) */
async function orderExists(env, orderNumber) {
  const { SUPABASE_URL, SERVICE_KEY } = env
  if (!SUPABASE_URL || !SERVICE_KEY) return false
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?select=id&order_number=eq.${encodeURIComponent(orderNumber)}&limit=1`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    )
    if (!res.ok) return false
    return (await res.json()).length > 0
  } catch {
    return false
  }
}

/** Record a paid order from Stripe metadata (shared by both event types). */
async function recordPaidOrder(env, { metadata, sessionId, paymentIntentId, fallbackTotal, details }) {
  const m = metadata || {}
  const orderNumber = m.order_number
  if (!orderNumber) {
    console.error('Stripe webhook: no order_number in metadata.')
    return { skipped: true }
  }
  if (await orderExists(env, orderNumber)) return { duplicate: true }

  let items = []
  try {
    items = JSON.parse(m.items || '[]')
  } catch {
    items = []
  }

  const customer = {
    name: m.customer_name || details?.name || '',
    email: m.customer_email || details?.email || '',
    phone: m.customer_phone || details?.phone || '',
    note: m.note || null,
  }

  const subtotal = num(m.subtotal)
  const discount = num(m.discount)
  const shipping = num(m.shipping)
  const total = num(m.total) || fallbackTotal || 0
  const fulfillment = m.fulfillment === 'ship' ? 'ship' : 'delivery'

  const orderRow = {
    order_number: orderNumber,
    user_id: m.user_id || null,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    note: customer.note,
    fulfillment,
    status: 'pending',
    payment_status: 'paid',
    subtotal,
    discount,
    shipping,
    referral_code: m.referral_code || null,
    affiliate_id: m.affiliate_id || null,
    total,
    stripe_session_id: sessionId || null,
    stripe_payment_intent: paymentIntentId || null,
    items: items.map((i) => ({ id: i.id, name: i.name, qty: Number(i.qty), price: Number(i.price) })),
  }

  const { recorded, dbError } = await recordOrder(env, orderRow)
  if (!recorded) console.error('Stripe order not recorded:', dbError)

  try {
    await sendOrderEmails(env, {
      orderNumber,
      customer,
      items: orderRow.items,
      subtotal,
      discount,
      shipping,
      total,
      referralCode: orderRow.referral_code,
      fulfillment,
      paymentStatus: 'paid',
    })
    await metaCapiPurchase(env, { orderNumber, customer, items: orderRow.items, total })
  } catch (err) {
    console.error('Stripe post-order tasks error:', err.message)
  }
  return { recorded }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
  if (!STRIPE_SECRET_KEY || !WEBHOOK_SECRET) {
    console.error('Stripe webhook not configured (missing secret).')
    return { statusCode: 500, body: 'not configured' }
  }
  const stripe = new Stripe(STRIPE_SECRET_KEY)

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : event.body || ''
  const sig = (event.headers || {})['stripe-signature']

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(raw, sig, WEBHOOK_SECRET)
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  const env = readEnv()
  let result = { ignored: stripeEvent.type }

  try {
    if (stripeEvent.type === 'payment_intent.succeeded') {
      const pi = stripeEvent.data.object
      result = await recordPaidOrder(env, {
        metadata: pi.metadata,
        paymentIntentId: pi.id,
        fallbackTotal: pi.amount_received ? pi.amount_received / 100 : pi.amount / 100,
        details: {
          name: pi.shipping?.name,
          email: pi.receipt_email,
          phone: pi.shipping?.phone,
        },
      })
    } else if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object
      if (!session.payment_status || session.payment_status === 'paid') {
        result = await recordPaidOrder(env, {
          metadata: session.metadata,
          sessionId: session.id,
          paymentIntentId:
            typeof session.payment_intent === 'string' ? session.payment_intent : null,
          fallbackTotal: session.amount_total ? session.amount_total / 100 : 0,
          details: {
            name: session.customer_details?.name,
            email: session.customer_details?.email || session.customer_email,
            phone: session.customer_details?.phone,
          },
        })
      }
    }
  } catch (err) {
    console.error('Stripe webhook handler error:', err.message)
    // Still 200 so Stripe doesn't hammer retries on a non-signature error we've logged.
  }

  return { statusCode: 200, body: JSON.stringify({ received: true, ...result }) }
}
