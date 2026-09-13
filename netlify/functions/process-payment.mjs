// Renew — online card payment via TagadaPay (Direct S2S / Path A).
//
// The browser tokenizes the card with @tagadapay/core-js (the PAN never touches
// our server), then posts the single-use `tagadaToken` here. We re-price the
// cart against Supabase (never trust the client amount), create a reusable
// payment instrument, optionally open a 3-D Secure session, and charge the card
// through TagadaPay's public REST API. On success we record the paid order and
// send the same branded Resend emails as the pay-on-delivery flow.
//
// TagadaPay handles all acquirer/processor routing internally — we only speak
// to the abstract TagadaPay endpoints below.
//
// Required Netlify environment variables (Site settings → Environment):
//   TAGADA_API_KEY      TPA-restricted processing key (tp_sk_live_… / tp_sk_test_…)
//   TAGADA_STORE_ID     The merchant store id (store_…) — from stores.list()
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY  (shared with orders)
// Optional:
//   TAGADA_BASE_URL     default https://api.tagadapay.io
//   TAGADA_CURRENCY     default USD
//   SITE_URL            default https://renewlabslv.com (used for the 3DS return)
//   ORDER_FROM_EMAIL, ORDER_NOTIFY_EMAILS, META_PIXEL_ID, META_CAPI_TOKEN
//
// If TAGADA_API_KEY / TAGADA_STORE_ID are not set, this endpoint returns 503 so
// the checkout page can cleanly fall back to pay-on-delivery.

import {
  readEnv,
  round2,
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

const tagadaEnv = () => ({
  API_KEY: process.env.TAGADA_API_KEY,
  STORE_ID: process.env.TAGADA_STORE_ID,
  BASE_URL: (process.env.TAGADA_BASE_URL || 'https://api.tagadapay.io').replace(/\/+$/, ''),
  CURRENCY: (process.env.TAGADA_CURRENCY || 'USD').toUpperCase(),
  SITE_URL: (process.env.SITE_URL || 'https://renewlabslv.com').replace(/\/+$/, ''),
})

/** POST JSON to a TagadaPay endpoint with the processing key. Throws on error. */
async function tp(base, apiKey, path, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || `TagadaPay ${res.status}`
    const err = new Error(msg)
    err.status = res.status
    err.code = data?.error?.code
    throw err
  }
  return data
}

/** Pull a nested id regardless of the exact casing TagadaPay returns. */
const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = k.split('.').reduce((o, part) => (o == null ? o : o[part]), obj)
    if (v != null) return v
  }
  return null
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  const t = tagadaEnv()
  if (!t.API_KEY || !t.STORE_ID) {
    // Not configured yet (e.g. still in KYB) — let the client fall back.
    return json(503, { error: 'Online card payments are not enabled yet.', configured: false })
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON.' })
  }

  const customer = payload.customer || {}
  const tagadaToken = payload.tagadaToken
  const items = Array.isArray(payload.items) ? payload.items : []

  if (!tagadaToken) return json(400, { error: 'Missing card token.' })
  if (!customer.name || !customer.email || !customer.phone) {
    return json(400, { error: 'Name, email, and phone are required.' })
  }
  if (items.length === 0) return json(400, { error: 'Your cart is empty.' })

  const env = readEnv()

  // 1. Authoritative re-pricing (server-side; the client amount is ignored).
  const { items: priced, subtotal, error: priceError } = await verifyItems(env, items)
  if (priceError) return json(400, { error: priceError })

  // 2. Affiliate discount, resolved + recomputed server-side.
  const { referralCode, affiliateId, discount } = await resolveAffiliate(
    env,
    payload.referral_code,
    subtotal
  )

  // 3. Shipping (delivery is free; a shipped order is estimated from the ZIP).
  const fulfillment = payload.fulfillment === 'ship' ? 'ship' : 'delivery'
  const shipping = fulfillment === 'ship' ? shippingEstimate(payload.zip).fee : 0

  const total = Math.max(0, round2(subtotal - discount + shipping))
  const amountMinor = Math.round(total * 100) // TagadaPay expects minor units
  if (amountMinor <= 0) return json(400, { error: 'Order total must be greater than zero.' })

  const orderNumber = makeOrderNumber()
  const [firstName, ...rest] = String(customer.name).trim().split(/\s+/)
  const lastName = rest.join(' ') || firstName

  try {
    // 4. Exchange the single-use token for a reusable instrument (+ customer).
    const inst = await tp(t.BASE_URL, t.API_KEY, '/api/public/v1/payment-instruments/create-from-token', {
      tagadaToken,
      storeId: t.STORE_ID,
      customerData: { email: customer.email, firstName, lastName },
    })
    const paymentInstrumentId = pick(inst, 'paymentInstrument.id', 'payment_instrument.id', 'id')
    const customerId = pick(inst, 'customer.id', 'customerId', 'customer_id')
    if (!paymentInstrumentId) {
      return json(502, { error: 'Card could not be prepared for charging.' })
    }

    // 5. Optional 3-D Secure session (recommended when the tokenizer flags SCA).
    let threedsSessionId = null
    if (payload.scaRequired) {
      try {
        const tds = await tp(t.BASE_URL, t.API_KEY, '/api/public/v1/threeds/create-session', {
          provider: 'basis_theory',
          storeId: t.STORE_ID,
          paymentInstrumentId,
          sessionData: payload.sessionData,
        })
        threedsSessionId = pick(tds, 'id', 'session.id', 'threedsSessionId')
      } catch (err) {
        // Non-fatal: process() can still challenge via redirect if needed.
        console.warn('3DS session create failed (continuing):', err.message)
      }
    }

    // 6. Charge the card.
    const proc = await tp(t.BASE_URL, t.API_KEY, '/api/public/v1/payments/process', {
      paymentInstrumentId,
      customerId,
      storeId: t.STORE_ID,
      amount: amountMinor,
      currency: t.CURRENCY,
      paymentMethod: 'card',
      mode: 'purchase',
      threedsSessionId: threedsSessionId || undefined,
      returnUrl: `${t.SITE_URL}/checkout?tp_return=1&order=${encodeURIComponent(orderNumber)}`,
      metadata: { order_number: orderNumber },
    })

    const payment = proc?.payment || proc
    const status = String(pick(payment, 'status') || '').toLowerCase()
    const requireAction = pick(payment, 'requireAction', 'require_action')
    const paymentId = pick(payment, 'id', 'paymentId', 'payment_id')

    // 6a. Additional authentication required (rare for US cards). Hand the
    //     redirect URL back to the browser; the order is NOT recorded as paid
    //     until the charge settles. NOTE: full post-redirect reconciliation
    //     needs a status/verify endpoint or webhook confirmed with TagadaPay —
    //     verify this branch against live keys before relying on it.
    if (requireAction === 'redirect') {
      const redirectUrl = pick(
        payment,
        'requireActionData.redirectUrl',
        'require_action_data.redirect_url',
        'redirectUrl'
      )
      return json(200, { requireAction: 'redirect', redirectUrl, order_number: orderNumber })
    }

    const SUCCESS = ['succeeded', 'paid', 'captured', 'completed', 'authorized', 'success']
    if (!SUCCESS.includes(status)) {
      const reason = pick(payment, 'error.message', 'declineReason', 'message') || 'Payment was declined.'
      return json(402, { error: reason, status })
    }

    // 7. Record the paid order (service role) + send branded emails.
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
      sms_consent: payload.sms_consent === true,
      tagada_payment_id: paymentId || null,
      tagada_payment_instrument_id: paymentInstrumentId,
      items: priced.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
    }

    const { recorded, dbError } = await recordOrder(env, orderRow)

    await sendOrderEmails(env, {
      orderNumber,
      customer,
      items: priced,
      subtotal,
      discount,
      shipping,
      total,
      referralCode,
      fulfillment,
      paymentStatus: 'paid',
    })

    await metaCapiPurchase(env, { orderNumber, customer, items: priced, total })

    return json(200, {
      ok: true,
      order_number: orderNumber,
      subtotal,
      discount,
      shipping,
      total,
      referral_code: referralCode,
      payment_status: 'paid',
      recorded,
      db_error: dbError,
    })
  } catch (err) {
    console.error('process-payment error:', err)
    // Surface a customer-safe message; the specifics are in the function logs.
    const safe =
      err.code === 'invalid_api_key' || err.code === 'missing_api_key'
        ? 'Payment is temporarily unavailable. Please try again shortly.'
        : err.message || 'We couldn’t process your payment. Please try again.'
    return json(err.status && err.status < 500 ? 402 : 502, { error: safe })
  }
}
