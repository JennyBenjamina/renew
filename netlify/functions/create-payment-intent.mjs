// Renew — create a Stripe PaymentIntent for the embedded card flow.
//
// The browser (Stripe Payment Element) calls this to get a client_secret, then
// confirms the card on-page — no redirect. We re-price the cart server-side
// (client amount is ignored) and apply the affiliate discount. The order is
// recorded only when payment succeeds, by stripe-webhook (payment_intent.succeeded).
//
// Required Netlify env:
//   STRIPE_SECRET_KEY            sk_live_… / sk_test_…
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Optional: SITE_URL (default https://renewlabslv.com)

import Stripe from 'stripe'
import {
  readEnv,
  round2,
  makeOrderNumber,
  verifyItems,
  resolveAffiliate,
} from './_order.mjs'
import { shippingEstimate } from './_shipping.mjs'

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
  if (!STRIPE_SECRET_KEY) {
    return json(503, { error: 'Card payments are not enabled yet.', configured: false })
  }
  const stripe = new Stripe(STRIPE_SECRET_KEY)

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
  if (items.length === 0) return json(400, { error: 'Your cart is empty.' })

  const env = readEnv()

  const { items: priced, subtotal, error: priceError } = await verifyItems(env, items)
  if (priceError) return json(400, { error: priceError })

  const { referralCode, affiliateId, discount } = await resolveAffiliate(
    env,
    payload.referral_code,
    subtotal
  )

  const fulfillment = payload.fulfillment === 'ship' ? 'ship' : 'delivery'
  const shipping = fulfillment === 'ship' ? shippingEstimate(payload.zip).fee : 0
  const total = Math.max(0, round2(subtotal - discount + shipping))
  const amountMinor = Math.round(total * 100)
  if (amountMinor <= 0) return json(400, { error: 'Order total must be greater than zero.' })

  const orderNumber = makeOrderNumber()

  const metadata = {
    order_number: orderNumber,
    user_id: payload.user_id || '',
    referral_code: referralCode || '',
    affiliate_id: affiliateId || '',
    fulfillment,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    note: (customer.note || '').slice(0, 480),
    subtotal: String(subtotal),
    discount: String(discount),
    shipping: String(shipping),
    total: String(total),
    items: JSON.stringify(
      priced.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }))
    ).slice(0, 490),
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount: amountMinor,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      receipt_email: customer.email,
      description: `Renew order ${orderNumber}`,
      metadata,
    })
    return json(200, {
      clientSecret: intent.client_secret,
      order_number: orderNumber,
      amount: amountMinor,
    })
  } catch (err) {
    console.error('create-payment-intent error:', err?.message || err)
    return json(502, { error: 'Could not start payment. Please try again.' })
  }
}
