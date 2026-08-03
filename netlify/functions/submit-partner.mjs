// Renew — partner / affiliate application.
// Emails the store owners via Resend and (optionally) records the application
// in Supabase. Runs server-side on Netlify so secret keys are never exposed.
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

  const firstName = (payload.first_name || '').trim()
  const lastName = (payload.last_name || '').trim()
  const email = (payload.email || '').trim()
  const message = (payload.message || '').trim()
  const socials = payload.socials || {}

  if (!firstName || !email) {
    return json(400, { error: 'First name and email are required.' })
  }

  // Record (optional — needs the partner_applications table + service key).
  if (SUPABASE_URL && SERVICE_KEY) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/partner_applications`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          message,
          socials,
        }),
      })
    } catch (err) {
      console.error('Partner insert error:', err)
    }
  }

  // Emails via Resend — branded shell with the Renew logo.
  const shell = (inner) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe7;margin:0;padding:28px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7ddce;border-radius:16px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;">
        <tr><td align="center" style="padding:30px 40px 4px;">
          <img src="https://renewlabslv.com/logo-mark.png" alt="Renew" width="150" style="display:block;width:150px;max-width:55%;height:auto;" />
        </td></tr>
        <tr><td style="padding:10px 40px 26px;color:#333330;">${inner}</td></tr>
        <tr><td style="padding:0 40px;"><div style="border-top:1px solid #eee4d8;"></div></td></tr>
        <tr><td style="padding:16px 40px 28px;">
          <p style="margin:0;font-size:11px;line-height:1.6;color:#a0a29c;text-align:center;">Renew — research compounds synthesized for precision.<br />For laboratory research use only. Not for human consumption.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>`

  const socialRows = Object.entries(socials)
    .filter(([, v]) => v && String(v).trim())
    .map(
      ([k, v]) =>
        `<tr><td style="color:#8b8d87;padding:4px 0;text-transform:capitalize;">${esc(k)}</td>` +
        `<td style="text-align:right;">${esc(v)}</td></tr>`
    )
    .join('')

  const ownerHtml = shell(`
    <h2 style="font-weight:600;font-size:20px;margin:0 0 6px;">New partnership application</h2>
    <p style="color:#5c5f58;margin:0 0 16px;">Someone applied to partner with Renew.</p>
    <table style="width:100%;font-size:14px;">
      <tr><td style="color:#8b8d87;padding:4px 0;">Name</td><td style="text-align:right;">${esc(firstName)} ${esc(lastName)}</td></tr>
      <tr><td style="color:#8b8d87;padding:4px 0;">Email</td><td style="text-align:right;">${esc(email)}</td></tr>
      ${socialRows}
    </table>
    ${message ? `<h3 style="margin:18px 0 6px;font-size:15px;">Message</h3><p style="color:#5c5f58;line-height:1.6;white-space:pre-wrap;">${esc(message)}</p>` : ''}
    <p style="color:#8b8d87;font-size:12px;margin-top:18px;">Reply to this email to reach the applicant.</p>
  `)

  const applicantHtml = shell(`
    <h2 style="font-weight:600;font-size:20px;margin:0 0 10px;">Thanks for applying, ${esc(firstName)}!</h2>
    <p style="color:#5c5f58;line-height:1.6;margin:0 0 12px;">
      We’ve received your application to partner with Renew. Our team will review
      it and reach out by email if it’s a fit. We appreciate your interest in
      representing a brand built on transparency and scientific rigor.
    </p>
    <p style="color:#5c5f58;line-height:1.6;margin:0;">
      Questions in the meantime? Just reply to this email.
    </p>
  `)

  async function sendEmail(to, subject, html, replyTo) {
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — email not sent to', to)
      return
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM, to, subject, html, reply_to: replyTo }),
      })
      if (!res.ok) console.error('Resend failed:', res.status, await res.text())
    } catch (err) {
      console.error('Resend error:', err)
    }
  }

  await Promise.all([
    sendEmail(
      NOTIFY,
      `Partnership application — ${firstName} ${lastName}`.trim(),
      ownerHtml,
      email
    ),
    sendEmail(
      [email],
      'Thanks for applying to partner with Renew',
      applicantHtml,
      NOTIFY[0]
    ),
  ])

  return json(200, { ok: true })
}
