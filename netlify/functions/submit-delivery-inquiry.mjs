// Renew — delivery availability inquiry.
// Records the email + zip in Supabase and emails the store owners a
// notification. Does NOT email the person who inquired.
//
// Uses the same env vars as the order function:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY,
//   ORDER_FROM_EMAIL (from), ORDER_NOTIFY_EMAILS (recipients)

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

const esc = (s = '') =>
  String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM = process.env.ORDER_FROM_EMAIL || 'Renew <orders@renewlabslv.com>'
  const NOTIFY = (
    process.env.ORDER_NOTIFY_EMAILS ||
    'abrahamleencoln@gmail.com,jennylee1989@gmail.com'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON.' })
  }

  const email = (payload.email || '').trim()
  const zip = (payload.zip || '').trim()

  if (!email || !zip) {
    return json(400, { error: 'Email and ZIP code are required.' })
  }

  // Record in Supabase (optional — needs the table + service key).
  if (SUPABASE_URL && SERVICE_KEY) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/delivery_inquiries`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ email, zip }),
      })
    } catch (err) {
      console.error('Delivery inquiry insert error:', err)
    }
  }

  // Notify the owners only (no email to the inquirer).
  const html = `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#333330;">
    <h2 style="font-weight:600;font-size:20px;margin:0 0 6px;">Delivery availability inquiry</h2>
    <p style="color:#5c5f58;margin:0 0 16px;">Someone checked delivery availability on the site.</p>
    <table style="width:100%;font-size:14px;">
      <tr><td style="color:#8b8d87;padding:4px 0;">Email</td><td style="text-align:right;">${esc(email)}</td></tr>
      <tr><td style="color:#8b8d87;padding:4px 0;">ZIP / Postal code</td><td style="text-align:right;">${esc(zip)}</td></tr>
    </table>
    <p style="color:#8b8d87;font-size:12px;margin-top:18px;">Reply to this email to reach them.</p>
  </div>`

  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to: NOTIFY,
          reply_to: email,
          subject: `Delivery inquiry — ${zip}`,
          html,
        }),
      })
      if (!res.ok) console.error('Resend failed:', res.status, await res.text())
    } catch (err) {
      console.error('Resend error:', err)
    }
  } else {
    console.warn('RESEND_API_KEY not set — inquiry email not sent.')
  }

  return json(200, { ok: true })
}
