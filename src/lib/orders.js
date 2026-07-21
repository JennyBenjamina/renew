/* Client helper to submit a local-pickup order.
 * Posts to the Netlify function, which records the order in Supabase and
 * emails the store owners. No payment is taken — payment happens at pickup. */

import { supabase, isSupabaseConfigured } from './supabaseClient'

export const PICKUP_PHONE = '(424) 877-5528'
export const PICKUP_PHONE_HREF = 'tel:+14248775528'

export const ORDER_STATUSES = ['pending', 'ready', 'delivered', 'cancelled']

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

export async function submitOrder({ customer, items, userId }) {
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
