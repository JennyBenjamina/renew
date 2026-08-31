import { supabase, isSupabaseConfigured } from './supabaseClient'

/* Affiliate / sales-rep data layer.
 * - validateReferral: public (checkout) — checks a code via a Netlify function.
 * - affiliate* : for a logged-in rep (RLS returns only their own data).
 * - admin* : for admins to manage reps and see per-rep totals. */

function requireSupabase() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.')
}

/** Validate a referral / discount code at checkout. Returns
 *  { valid, code, name, discount_percent }. */
export async function validateReferral(code) {
  try {
    const res = await fetch('/.netlify/functions/validate-referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    return await res.json()
  } catch {
    return { valid: false }
  }
}

/** The signed-in rep's own affiliate record (via RLS). */
export async function affiliateGetSelf() {
  requireSupabase()
  const { data, error } = await supabase.from('affiliates').select('*').maybeSingle()
  if (error) throw error
  return data
}

/** Orders attributed to the signed-in rep (via RLS). */
export async function affiliateListOrders() {
  requireSupabase()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .not('affiliate_id', 'is', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/* ---- Admin ---- */

export async function adminListAffiliates() {
  requireSupabase()
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function adminCreateAffiliate({ code, name, email, discount_percent }) {
  requireSupabase()
  const { data, error } = await supabase
    .from('affiliates')
    .insert({
      code: String(code).trim().toLowerCase(),
      name: name?.trim() || null,
      email: email?.trim().toLowerCase() || null,
      discount_percent: Number(discount_percent) || 0,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function adminUpdateAffiliate(id, patch) {
  requireSupabase()
  const { data, error } = await supabase
    .from('affiliates')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** The full shareable link for a code. */
export function referralLink(code) {
  return `https://renewlabslv.com/?ref=${encodeURIComponent(code)}`
}
