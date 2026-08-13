// Renew — newsletter subscribe → Supabase.
// Stores the email in the `subscribers` table (server-side, service role). No
// third-party email tool: manage and export subscribers from the admin portal,
// then import the CSV into Resend Audiences when you want to send a campaign.
//
// Required Netlify environment variables:
//   SUPABASE_URL                 e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    Supabase → Project Settings → API → service_role (SECRET)

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  let email
  try {
    email = (JSON.parse(event.body || '{}').email || '').trim().toLowerCase()
  } catch {
    return json(400, { error: 'Invalid JSON.' })
  }
  if (!email || !/.+@.+\..+/.test(email)) {
    return json(400, { error: 'Please enter a valid email.' })
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.warn('Supabase env not set — subscriber not stored:', email)
    // Still return success so the visitor isn't shown an error.
    return json(200, { ok: true, stored: false })
  }

  try {
    // Insert; ignore duplicates so re-subscribing the same email is harmless.
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/subscribers?on_conflict=email`,
      {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=ignore-duplicates,return=minimal',
        },
        body: JSON.stringify({ email, source: 'footer' }),
      }
    )
    if (!res.ok) {
      console.error('Subscriber insert failed:', res.status, await res.text())
      return json(200, { ok: true, stored: false })
    }
  } catch (err) {
    console.error('Subscriber insert error:', err)
    return json(200, { ok: true, stored: false })
  }

  return json(200, { ok: true, stored: true })
}
