/* Client helper to submit a local-pickup order.
 * Posts to the Netlify function, which records the order in Supabase and
 * emails the store owners. No payment is taken — payment happens at pickup. */

export const PICKUP_PHONE = '(424) 877-5528'
export const PICKUP_PHONE_HREF = 'tel:+14248775528'

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
