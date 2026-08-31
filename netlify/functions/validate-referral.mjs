// Renew — validate an affiliate referral / discount code at checkout.
// Returns only safe, public fields ({ valid, name, discount_percent }). Uses the
// service role to read the affiliates table (which is otherwise private).
//
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  let code
  try {
    code = (JSON.parse(event.body || '{}').code || '').trim()
  } catch {
    return json(400, { error: 'Invalid JSON.' })
  }
  if (!code) return json(200, { valid: false })

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) return json(200, { valid: false })

  try {
    const url =
      `${SUPABASE_URL}/rest/v1/affiliates` +
      `?select=code,name,discount_percent,active` +
      `&code=ilike.${encodeURIComponent(code)}&active=eq.true&limit=1`
    const res = await fetch(url, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    })
    if (!res.ok) return json(200, { valid: false })
    const rows = await res.json()
    const a = Array.isArray(rows) && rows[0]
    if (!a) return json(200, { valid: false })
    return json(200, {
      valid: true,
      code: a.code,
      name: a.name || null,
      discount_percent: a.discount_percent,
    })
  } catch (err) {
    console.error('validate-referral error:', err)
    return json(200, { valid: false })
  }
}
