// Renew — charge a card with Square, then record a PAID delivery order.
// The browser tokenizes the card with Square's Web Payments SDK and sends the
// single-use token here; this function charges it server-side (the amount is
// recomputed from the products table so it can't be tampered with).
//
// Required Netlify environment variables:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (order recording + price verify)
//   RESEND_API_KEY                            (receipts)
//   SQUARE_ACCESS_TOKEN                        Square → Developer → Credentials (SECRET)
//   SQUARE_LOCATION_ID                         Square location to attribute payments to
//   SQUARE_ENV                                 'sandbox' (default) or 'production'

import crypto from 'node:crypto'
import {
  readEnv,
  round2,
  money,
  makeOrderNumber,
  verifyItems,
  resolveAffiliate,
  recordOrder,
  sendOrderEmails,
  metaCapiPurchase,
} from './_order.mjs'
import { shippingEstimate } from './_shipping.mjs'

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON.' })
  }

  const token = payload.token // Square single-use card token (source_id)
  const customer = payload.customer || {}
  if (!token) return json(400, { error: 'Missing payment token.' })
  if (!customer.name || !customer.email || !customer.phone) {
    return json(400, { error: 'Name, email, and phone are required.' })
  }

  const env = readEnv()

  // 1. Authoritative pricing (never trust the client for the charge amount).
  const { items, subtotal, error: itemsError } = await verifyItems(env, payload.items)
  if (itemsError) return json(400, { error: itemsError })

  // 2. Affiliate discount (server-side).
  const { referralCode, affiliateId, discount } = await resolveAffiliate(
    env,
    payload.referral_code,
    subtotal
  )
  // 2b. Shipping (server authoritative): a fee only when shipping, from the ZIP.
  const fulfillment = payload.fulfillment === 'ship' ? 'ship' : 'delivery'
  const shipping = fulfillment === 'ship' ? shippingEstimate(payload.zip).fee : 0

  const total = Math.max(0, round2(subtotal - discount + shipping))
  const amountCents = Math.round(total * 100)
  if (amountCents <= 0) return json(400, { error: 'Order total must be greater than zero.' })

  // 3. Charge the card with Square.
  const SQ_TOKEN = process.env.SQUARE_ACCESS_TOKEN
  const SQ_LOCATION = process.env.SQUARE_LOCATION_ID
  const SQ_ENV = (process.env.SQUARE_ENV || 'sandbox').toLowerCase()
  if (!SQ_TOKEN || !SQ_LOCATION) {
    return json(500, { error: 'Square is not configured on the server.' })
  }
  const base =
    SQ_ENV === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com'

  const orderNumber = makeOrderNumber()
  let squarePaymentId = null
  try {
    const res = await fetch(`${base}/v2/payments`, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-08-21',
        Authorization: `Bearer ${SQ_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_id: token,
        idempotency_key: crypto.randomUUID(),
        amount_money: { amount: amountCents, currency: 'USD' },
        location_id: SQ_LOCATION,
        reference_id: orderNumber,
        note: `Renew order ${orderNumber}`,
        buyer_email_address: customer.email,
      }),
    })
    const data = await res.json().catch(() => ({}))
    const status = data?.payment?.status
    if (!res.ok || (status !== 'COMPLETED' && status !== 'APPROVED')) {
      const msg = data?.errors?.[0]?.detail || 'Card was declined. Please try another card.'
      console.error('Square payment failed:', res.status, JSON.stringify(data?.errors || data))
      return json(402, { error: msg })
    }
    squarePaymentId = data.payment.id
  } catch (err) {
    console.error('Square request error:', err)
    return json(502, { error: 'Could not reach the payment processor. Please try again.' })
  }

  // 4. Payment succeeded — record the order as PAID.
  const orderRow = {
    order_number: orderNumber,
    user_id: payload.user_id || null,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    note: customer.note || null,
    fulfillment,
    status: 'pending',
    payment_status: 'paid',
    subtotal,
    discount,
    shipping,
    referral_code: referralCode,
    affiliate_id: affiliateId,
    total,
    items,
    square_payment_id: squarePaymentId,
  }
  const { recorded, dbError } = await recordOrder(env, orderRow)

  // 5. Receipts + analytics (best-effort; payment already succeeded).
  await sendOrderEmails(env, {
    orderNumber,
    customer,
    items,
    subtotal,
    discount,
    shipping,
    total,
    referralCode,
    fulfillment,
    paymentStatus: 'paid',
  })
  await metaCapiPurchase(env, { orderNumber, customer, items, total })

  return json(200, {
    ok: true,
    order_number: orderNumber,
    subtotal,
    discount,
    total,
    referral_code: referralCode,
    payment_id: squarePaymentId,
    recorded,
    db_error: dbError,
  })
}
