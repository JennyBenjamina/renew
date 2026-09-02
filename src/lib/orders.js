/* Client helper to submit a delivery order.
 * Posts to the Netlify function, which records the order in Supabase and
 * emails the store owners. No payment is taken — payment happens on delivery. */

import { supabase, isSupabaseConfigured } from './supabaseClient'

export const PICKUP_PHONE = '(424) 877-5528'
export const PICKUP_PHONE_HREF = 'tel:+14248775528'

export const ORDER_STATUSES = ['pending', 'ready', 'shipped', 'delivered', 'cancelled']
export const PAYMENT_STATUSES = ['unpaid', 'paid', 'cancelled']

export const CARRIERS = [
  { key: 'usps', name: 'USPS' },
  { key: 'ups', name: 'UPS' },
  { key: 'fedex', name: 'FedEx' },
  { key: 'dhl', name: 'DHL' },
  { key: 'other', name: 'Other' },
]

/** Public tracking URL for a stored carrier name + number (for admin display). */
export function trackingUrl(carrier, number) {
  if (!number) return null
  const c = String(carrier || '').toLowerCase()
  const n = encodeURIComponent(number)
  if (c.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`
  if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${n}`
  if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${n}`
  if (c.includes('dhl')) return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${n}`
  return null
}

/** Admin: mark an order shipped, save tracking, and email the customer.
 *  Goes through an admin-verified Netlify function (needs the session token). */
export async function notifyShipment({ orderId, carrier, trackingNumber }) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const res = await fetch('/.netlify/functions/notify-shipment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: session?.access_token,
      order_id: orderId,
      carrier,
      tracking_number: trackingNumber,
    }),
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    /* ignore */
  }
  if (!res.ok) throw new Error(data?.error || 'Could not send the tracking email.')
  return data
}

/** Admin: list every order, newest first. Requires an admin session (RLS). */
export async function adminListOrders() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/** Admin: change an order's status (e.g. pending → delivered). */
export async function updateOrderStatus(id, status) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Admin: change an order's payment status (unpaid → paid, etc.). */
export async function updateOrderPaymentStatus(id, payment_status) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase
    .from('orders')
    .update({ payment_status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Submit a delivery availability inquiry (email + zip). Records it and
 *  notifies the owners; does not email the person who inquired. */
export async function submitDeliveryInquiry({ email, zip }) {
  const res = await fetch('/.netlify/functions/submit-delivery-inquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, zip }),
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error(data?.error || 'Could not submit. Please try again.')
  }
  return data
}

/** Estimate the shipping fee for a destination ZIP (ships from Las Vegas). */
export async function estimateShipping(zip) {
  try {
    const res = await fetch('/.netlify/functions/estimate-shipping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zip }),
    })
    return await res.json() // { fee, zone, zoneName }
  } catch {
    return { fee: 0 }
  }
}

/** Charge a card with Square (via the create-square-payment function) and
 *  record a paid order. `token` is the single-use token from Square's SDK. */
export async function createSquarePayment({
  token,
  customer,
  items,
  userId,
  referralCode,
  fulfillment,
  zip,
}) {
  const res = await fetch('/.netlify/functions/create-square-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      customer,
      items: items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
      user_id: userId || null,
      referral_code: referralCode || null,
      fulfillment: fulfillment || 'delivery',
      zip: zip || '',
    }),
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    /* ignore */
  }
  if (!res.ok) throw new Error(data?.error || 'Payment could not be completed.')
  return data
}

export async function submitOrder({ customer, items, userId, referralCode, fulfillment, zip }) {
  const res = await fetch('/.netlify/functions/submit-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer,
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        price: i.price,
      })),
      user_id: userId || null,
      referral_code: referralCode || null,
      fulfillment: fulfillment || 'delivery',
      zip: zip || '',
    }),
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error(data?.error || 'Could not submit your order. Please try again.')
  }
  return data
}
