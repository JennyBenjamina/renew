// Renew — newsletter subscribe → Supabase (+ owner heads-up email).
// Stores the email in the `subscribers` table (server-side, service role) and
// emails the store owners when a NEW subscriber joins. No third-party email
// tool: manage/export subscribers from the admin portal, then import the CSV
// into Resend Audiences when you want to send a campaign.
//
// Required Netlify environment variables:
//   SUPABASE_URL                 e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    Supabase → Project Settings → API → service_role (SECRET)
//   RESEND_API_KEY               Resend API key (re_...) — for the heads-up email
// Optional overrides (shared with the order function):
//   ORDER_FROM_EMAIL             default: Renew <orders@renewlabslv.com>
//   ORDER_NOTIFY_EMAILS          comma-separated; default: the two owner emails

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

const esc = (s = '') =>
  String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))

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
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM = process.env.ORDER_FROM_EMAIL || 'Renew <orders@renewlabslv.com>'
  const NOTIFY = (
    process.env.ORDER_NOTIFY_EMAILS ||
    'abrahamleencoln@gmail.com,jennylee1989@gmail.com'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.warn('Supabase env not set — subscriber not stored:', email)
    return json(200, { ok: true, stored: false })
  }

  // Insert; ignore duplicates. return=representation lets us tell whether a NEW
  // row was created (non-empty array) vs a repeat signup (empty) so we only
  // email the owners for genuinely new subscribers.
  let isNew = false
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/subscribers?on_conflict=email`,
      {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=ignore-duplicates,return=representation',
        },
        body: JSON.stringify({ email, source: 'footer' }),
      }
    )
    if (!res.ok) {
      console.error('Subscriber insert failed:', res.status, await res.text())
      return json(200, { ok: true, stored: false })
    }
    const inserted = await res.json().catch(() => [])
    isNew = Array.isArray(inserted) && inserted.length > 0
  } catch (err) {
    console.error('Subscriber insert error:', err)
    return json(200, { ok: true, stored: false })
  }

  // Heads-up email to the owners — only for new subscribers.
  if (isNew && RESEND_API_KEY) {
    const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#333330;">
      <h2 style="font-weight:600;font-size:20px;margin:0 0 6px;">New newsletter subscriber</h2>
      <p style="color:#5c5f58;margin:0 0 16px;">Someone joined “Research updates from Renew”.</p>
      <table style="width:100%;font-size:14px;">
        <tr><td style="color:#8b8d87;padding:4px 0;">Email</td><td style="text-align:right;">${esc(email)}</td></tr>
        <tr><td style="color:#8b8d87;padding:4px 0;">Source</td><td style="text-align:right;">Footer signup</td></tr>
      </table>
      <p style="color:#8b8d87;font-size:12px;margin-top:18px;">Manage subscribers in the admin portal → Subscribers.</p>
    </div>`
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
          subject: `New subscriber — ${email}`,
          html,
        }),
      })
      if (!res.ok) console.error('Resend failed:', res.status, await res.text())
    } catch (err) {
      console.error('Resend error:', err)
    }
  } else if (isNew) {
    console.warn('RESEND_API_KEY not set — subscriber heads-up email not sent.')
  }

  return json(200, { ok: true, stored: true, isNew })
}
