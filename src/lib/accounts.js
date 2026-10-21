import { supabase, isSupabaseConfigured } from './supabaseClient'

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected']

/** Admin: every account profile, newest first (RLS lets admins read all). */
export async function adminListAccounts() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/** Admin: approve, reject, or reopen an account. Goes through a Netlify
 *  function that verifies the admin, saves the decision and emails the user. */
export async function reviewAccount({ userId, decision, note }) {
  const { data } = await supabase.auth.getSession()
  const res = await fetch('/.netlify/functions/review-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: data?.session?.access_token,
      user_id: userId,
      decision,
      note: note || null,
    }),
  })
  let body = null
  try {
    body = await res.json()
  } catch {
    /* ignore */
  }
  if (!res.ok) throw new Error(body?.error || 'Could not save the decision.')
  return body
}
