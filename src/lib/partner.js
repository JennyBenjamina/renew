/* Client helper to submit a partnership / affiliate application.
 * Posts to the Netlify function, which emails the owners and (optionally)
 * records the application in Supabase. */

import { supabase, isSupabaseConfigured } from './supabaseClient'

/** Admin: list partnership applications, newest first (requires admin session). */
export async function adminListApplications() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase
    .from('partner_applications')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function submitPartner(payload) {
  const res = await fetch('/.netlify/functions/submit-partner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error(data?.error || 'Could not submit your application. Please try again.')
  }
  return data
}
