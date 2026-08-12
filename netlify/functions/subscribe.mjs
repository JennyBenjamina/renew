// Renew — newsletter subscribe → Omnisend.
// Adds the email as a subscribed contact in Omnisend. Env-gated: if
// OMNISEND_API_KEY isn't set, it's a no-op that still returns success.
//
//   OMNISEND_API_KEY   Omnisend → Store settings → Integrations & API → API keys

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  let email
  try {
    email = (JSON.parse(event.body || '{}').email || '').trim()
  } catch {
    return json(400, { error: 'Invalid JSON.' })
  }
  if (!email || !/.+@.+\..+/.test(email)) {
    return json(400, { error: 'Please enter a valid email.' })
  }

  const KEY = process.env.OMNISEND_API_KEY
  if (!KEY) {
    console.warn('OMNISEND_API_KEY not set — subscriber not sent to Omnisend:', email)
    return json(200, { ok: true, stored: false })
  }

  try {
    const res = await fetch('https://api.omnisend.com/v3/contacts', {
      method: 'POST',
      headers: { 'X-API-KEY': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifiers: [
          {
            type: 'email',
            id: email,
            channels: {
              email: { status: 'subscribed', statusDate: new Date().toISOString() },
            },
          },
        ],
        tags: ['newsletter', 'renew-site'],
      }),
    })
    if (!res.ok) {
      const t = await res.text()
      console.error('Omnisend failed:', res.status, t)
      // 409 = already exists; treat as success for the visitor.
      if (res.status !== 409) return json(200, { ok: true, stored: false })
    }
  } catch (err) {
    console.error('Omnisend error:', err)
    return json(200, { ok: true, stored: false })
  }

  return json(200, { ok: true, stored: true })
}
