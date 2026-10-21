// Renew — approve or reject a researcher account (compliance gate). Admin-only.
// Updates the profile with the service role, then emails the account holder
// the decision.
//
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, ORDER_FROM_EMAIL
//   Optional: SITE_URL (default https://renewlabslv.com)

import { readEnv, emailShell } from './_order.mjs'

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

const esc = (s = '') =>
  String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))

const DECISIONS = new Set(['approved', 'rejected', 'pending'])

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON.' })
  }

  const accessToken = body.access_token
  const userId = String(body.user_id || '')
  const decision = body.decision
  const note = String(body.note || '').trim().slice(0, 1000) || null
  if (!accessToken) return json(401, { error: 'Not authenticated.' })
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return json(400, { error: 'Account is required.' })
  if (!DECISIONS.has(decision)) return json(400, { error: 'Unknown decision.' })

  const env = readEnv()
  const { SUPABASE_URL, SERVICE_KEY, RESEND_API_KEY, FROM } = env
  if (!SUPABASE_URL || !SERVICE_KEY) return json(500, { error: 'Server not configured.' })
  const svc = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }

  // 1. Verify the caller is a signed-in admin.
  let adminId
  try {
    const uRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${accessToken}` },
    })
    if (!uRes.ok) return json(401, { error: 'Session expired — sign in again.' })
    adminId = (await uRes.json())?.id
    const pRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=role&id=eq.${adminId}&limit=1`,
      { headers: svc }
    )
    const role = pRes.ok ? (await pRes.json())[0]?.role : null
    if (role !== 'admin') return json(403, { error: 'Admins only.' })
  } catch (err) {
    console.error('Auth check error:', err)
    return json(500, { error: 'Could not verify access.' })
  }

  // 2. Record the decision.
  let profile
  try {
    const upd = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: { ...svc, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({
        approval_status: decision,
        reviewed_at: decision === 'pending' ? null : new Date().toISOString(),
        reviewed_by: decision === 'pending' ? null : adminId,
        review_note: note,
      }),
    })
    if (!upd.ok) {
      console.error('Profile update failed:', upd.status, await upd.text())
      return json(500, { error: 'Could not save the decision.' })
    }
    profile = (await upd.json())[0]
    if (!profile) return json(404, { error: 'Account not found.' })
  } catch (err) {
    console.error('Profile update error:', err)
    return json(500, { error: 'Could not save the decision.' })
  }

  // 3. Email the account holder (approve / reject only).
  let emailed = false
  if (decision !== 'pending' && RESEND_API_KEY && profile.email) {
    const site = (process.env.SITE_URL || 'https://renewlabslv.com').replace(/\/+$/, '')
    const approved = decision === 'approved'
    const html = emailShell(
      approved
        ? `
      <h2 style="font-weight:600;font-size:20px;margin:0 0 6px;">Your researcher account is approved</h2>
      <p style="color:#5c5f58;margin:0 0 16px;">Your Renew account${profile.institution ? ` for <strong>${esc(profile.institution)}</strong>` : ''} has been reviewed and approved. You now have access to the research product catalog.</p>
      <p style="margin:0 0 16px;"><a href="${site}/login" style="display:inline-block;background:#1c1d1a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;">Log in to Renew</a></p>
      <p style="color:#8b8d87;font-size:12px;margin:0;">All products are for in-vitro laboratory research only and are not for human or animal consumption.</p>`
        : `
      <h2 style="font-weight:600;font-size:20px;margin:0 0 6px;">Your registration wasn’t approved</h2>
      <p style="color:#5c5f58;margin:0 0 16px;">After review, we weren’t able to approve your Renew account for access to the research product catalog.</p>
      ${note ? `<p style="margin:0 0 16px;"><strong>Reviewer note:</strong> ${esc(note)}</p>` : ''}
      <p style="color:#5c5f58;margin:0;">If you believe this is a mistake, reply to this email with details of your research institution.</p>`
    )
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: [profile.email],
          subject: approved
            ? 'Your Renew researcher account is approved'
            : 'Your Renew account registration',
          html,
        }),
      })
      emailed = res.ok
      if (!res.ok) console.error('Resend failed:', res.status, await res.text())
    } catch (err) {
      console.error('Resend error:', err)
    }
  }

  return json(200, { ok: true, approval_status: profile.approval_status, emailed })
}
