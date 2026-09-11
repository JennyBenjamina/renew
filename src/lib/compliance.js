import { supabase, isSupabaseConfigured } from './supabaseClient'

/* Bump this whenever the wording of the compliance terms changes, so the log
 * reflects exactly which version each visitor agreed to. */
export const TERMS_VERSION = '2026-09-10'

/** Records a compliance-gate acceptance in Supabase — the authoritative,
 *  server-side record of who agreed to which terms version and when. Ties the
 *  acceptance to the signed-in account when one exists. Safe no-op when Supabase
 *  isn't configured, and never blocks the UI (failures are logged, not shown).
 *  Falls back to a version-only insert if the user_id column isn't present yet. */
export async function recordAcceptance({ remembered = false } = {}) {
  if (!isSupabaseConfigured) return
  try {
    let userId = null
    try {
      const { data } = await supabase.auth.getUser()
      userId = data?.user?.id || null
    } catch {
      /* not signed in / auth unavailable */
    }
    let { error } = await supabase
      .from('acceptance_log')
      .insert({ terms_version: TERMS_VERSION, remembered, user_id: userId })
    if (error) {
      // Retry without user_id in case the column migration hasn't run yet.
      ;({ error } = await supabase
        .from('acceptance_log')
        .insert({ terms_version: TERMS_VERSION, remembered }))
    }
    if (error) console.warn('Could not record acceptance:', error.message)
  } catch (err) {
    console.warn('Could not record acceptance:', err)
  }
}
