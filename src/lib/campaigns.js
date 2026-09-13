/* Admin SMS campaigns (Telnyx). Recipient preview is computed client-side from
 * the admin's own RLS-readable data; the actual send goes through the
 * send-campaign Netlify function (which re-gathers recipients authoritatively,
 * re-applies opt-outs, and holds the Telnyx key server-side). */

import { supabase, isSupabaseConfigured } from './supabaseClient'

/** Normalize a US phone to E.164, or null. Mirrors the server. */
export function toE164(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  if (s.startsWith('+')) {
    const d = s.replace(/[^\d]/g, '')
    return d.length >= 11 && d.length <= 15 ? `+${d}` : null
  }
  const d = s.replace(/\D/g, '')
  if (d.length === 10) return `+1${d}`
  if (d.length === 11 && d.startsWith('1')) return `+${d}`
  return null
}

/** Preview the recipient list: distinct customer phones minus opt-outs. */
export async function campaignRecipients() {
  if (!isSupabaseConfigured) return []
  const [{ data: orders, error: oErr }, { data: opts }] = await Promise.all([
    supabase.from('orders').select('customer_name, customer_phone, created_at').order('created_at', { ascending: false }),
    supabase.from('sms_opt_outs').select('phone_number').eq('active', true),
  ])
  if (oErr) throw oErr
  const suppressed = new Set((opts || []).map((o) => toE164(o.phone_number)).filter(Boolean))
  const seen = new Set()
  const list = []
  for (const o of orders || []) {
    const phone = toE164(o.customer_phone)
    if (!phone || seen.has(phone) || suppressed.has(phone)) continue
    seen.add(phone)
    list.push({ name: o.customer_name || '—', phone })
  }
  return list
}

/** Send the campaign. Returns { sent, failed, total, attempted, failures }. */
export async function sendCampaign(message, appendStop = true) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const res = await fetch('/.netlify/functions/send-campaign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: session?.access_token,
      message,
      append_stop: appendStop,
    }),
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    /* ignore */
  }
  if (!res.ok) throw new Error(data?.error || 'Could not send the campaign.')
  return data
}

/** Recent campaign history (admin RLS). */
export async function listCampaigns() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('sms_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data || []
}
