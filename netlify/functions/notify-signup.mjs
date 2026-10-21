// Renew — email the store owners when a new customer account is created.
// The client fires this right after signup; the function confirms a matching
// profile actually exists in Supabase before emailing (so the endpoint can't be
// used to spam the owners with fake signups).
//
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
//   ORDER_FROM_EMAIL (from), ORDER_NOTIFY_EMAILS (owner recipients)

import { readEnv, emailShell } from './_order.mjs'

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
    email = (JSON.parse(event.body || '{}').email || '').trim()
  } catch {
    return json(400, { error: 'Invalid JSON.' })
  }
  if (!email) return json(400, { error: 'Email required.' })

  const env = readEnv()
  const { SUPABASE_URL, SERVICE_KEY, RESEND_API_KEY, FROM, NOTIFY } = env
  if (!SUPABASE_URL || !SERVICE_KEY) return json(200, { ok: true, sent: false })

  // Confirm a real profile exists for this email (created at signup).
  let profile = null
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=email,full_name,phone,role,institution,approval_status,created_at` +
        `&email=ilike.${encodeURIComponent(email)}&limit=1`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    )
    profile = res.ok ? (await res.json())[0] : null
  } catch (err) {
    console.error('Signup lookup error:', err)
  }
  if (!profile) return json(200, { ok: true, sent: false })

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — signup notification not sent.')
    return json(200, { ok: true, sent: false })
  }

  const joined = (() => {
    try {
      return new Date(profile.created_at).toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  })()

  const html = emailShell(`
    <h2 style="font-weight:600;font-size:20px;margin:0 0 6px;">New researcher account to review</h2>
    <p style="color:#5c5f58;margin:0 0 16px;">Someone registered for a Renew account. It stays blocked from the catalog until you approve it.</p>
    <table style="width:100%;font-size:14px;">
      <tr><td style="color:#8b8d87;padding:4px 0;">Name</td><td style="text-align:right;">${esc(profile.full_name || '—')}</td></tr>
      <tr><td style="color:#8b8d87;padding:4px 0;">Email</td><td style="text-align:right;">${esc(profile.email || email)}</td></tr>
      <tr><td style="color:#8b8d87;padding:4px 0;">Institution</td><td style="text-align:right;">${esc(profile.institution || '—')}</td></tr>
      <tr><td style="color:#8b8d87;padding:4px 0;">Status</td><td style="text-align:right;">${esc(profile.approval_status || 'pending')}</td></tr>
      ${profile.phone ? `<tr><td style="color:#8b8d87;padding:4px 0;">Phone</td><td style="text-align:right;">${esc(profile.phone)}</td></tr>` : ''}
      <tr><td style="color:#8b8d87;padding:4px 0;">Role</td><td style="text-align:right;">${esc(profile.role || 'customer')}</td></tr>
      <tr><td style="color:#8b8d87;padding:4px 0;">Joined</td><td style="text-align:right;">${esc(joined)} PT</td></tr>
    </table>
    <p style="margin:18px 0 0;"><a href="${(process.env.SITE_URL || 'https://renewlabslv.com').replace(/\/+$/, '')}/admin/accounts">Review in the admin panel →</a></p>
    <p style="color:#8b8d87;font-size:12px;margin-top:12px;">Reply to reach the new member.</p>
  `)

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: NOTIFY,
        reply_to: profile.email || email,
        subject: `Account to review — ${profile.institution || profile.email || email}`,
        html,
      }),
    })
    if (!res.ok) console.error('Resend failed:', res.status, await res.text())
  } catch (err) {
    console.error('Resend error:', err)
  }

  return json(200, { ok: true, sent: true })
}
