import { supabase, isSupabaseConfigured } from './supabaseClient'

/* Admin data access for newsletter subscribers. Reads require Supabase + a
 * signed-in admin (enforced by row-level security). */

function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add your keys to .env.')
  }
}

export async function adminListSubscribers() {
  requireSupabase()
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/** Build a CSV string (email,source,signed_up) for export into Resend etc. */
export function subscribersToCsv(rows) {
  const header = 'email,source,signed_up'
  const lines = rows.map((r) => {
    const date = new Date(r.created_at).toISOString()
    return `${r.email},${r.source || ''},${date}`
  })
  return [header, ...lines].join('\n')
}
