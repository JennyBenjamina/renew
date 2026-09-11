// Renew — create a Stripe Checkout Session (hosted redirect flow).
//
// The browser calls this; we re-price the cart server-side (never trust the
// client amount), apply any affiliate discount, then hand back a Stripe-hosted
// checkout URL. Stripe handles cards, Apple/Google Pay, Link, 3-D Secure, and
// receipts. The order is recorded only once payment succeeds, by stripe-webhook.
//
// Required Netlify env:
//   STRIPE_SECRET_KEY            sk_live_… / sk_test_…
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (to re-price + resolve affiliate)
// Optional:
//   SITE_URL                     default https://renewlabslv.com
//
// If STRIPE_SECRET_KEY isn't set, returns 503 so checkout can fall back.

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
  const SITE_URL = (process.env.SITE_URL || 'https://renewlabslv.com').replace(/\/+$/, '')
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

  // 1. Authoritative re-pricing.
  const { items: priced, subtotal, error: priceError } = await verifyItems(env, items)
  if (priceError) return json(400, { error: priceError })

  // 2. Affiliate discount (server-side).
  const { referralCode, affiliateId, discount } = await resolveAffiliate(
    env,
    payload.referral_code,
    subtotal
  )

  // 3. Shipping (delivery is free; shipped orders estimated from ZIP).
  const fulfillment = payload.fulfillment === 'ship' ? 'ship' : 'delivery'
  const shipping = fulfillment === 'ship' ? shippingEstimate(payload.zip).fee : 0

  const total = Math.max(0, round2(subtotal - discount + shipping))
  const orderNumber = makeOrderNumber()

  const line_items = priced.map((i) => ({
    quantity: i.qty,
    price_data: {
      currency: 'usd',
      unit_amount: Math.round(Number(i.price) * 100),
      product_data: { name: i.name },
    },
  }))

  try {
    // A one-time coupon expresses the affiliate discount as a real Stripe line.
    let discounts
    if (discount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(discount * 100),
        currency: 'usd',
        duration: 'once',
        name: referralCode ? `Discount ${referralCode}` : 'Discount',
      })
      discounts = [{ coupon: coupon.id }]
    }

    const shipping_options =
      shipping > 0
        ? [
            {
              shipping_rate_data: {
                type: 'fixed_amount',
                fixed_amount: { amount: Math.round(shipping * 100), currency: 'usd' },
                display_name: 'Shipping',
              },
            },
          ]
        : undefined

    // Everything the webhook needs to record the order lives in metadata.
    const metadata = {
      order_number: orderNumber,
      user_id: payload.user_id || '',
      referral_code: referralCode || '',
      affiliate_id: affiliateId || '',
      fulfillment,
      customer_name: customer.name,
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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      discounts,
      shipping_options,
      customer_email: customer.email,
      client_reference_id: orderNumber,
      payment_intent_data: { metadata },
      metadata,
      success_url: `${SITE_URL}/checkout?stripe=success&order=${encodeURIComponent(orderNumber)}`,
      cancel_url: `${SITE_URL}/checkout?stripe=cancel`,
    })

    return json(200, { url: session.url, order_number: orderNumber })
  } catch (err) {
    console.error('create-checkout-session error:', err?.message || err)
    return json(502, { error: 'Could not start checkout. Please try again.' })
  }
}
