import { supabase, isSupabaseConfigured } from './supabaseClient'

/* Bump this whenever the wording of the compliance terms changes, so the log
 * reflects exactly which version each visitor agreed to. */
export const TERMS_VERSION = '2026-07-18'

/** Records a compliance-gate acceptance in Supabase.
 *  Minimal by design: terms version + timestamp only (no IP / PII).
 *  Safe no-op when Supabase isn't configured, and never blocks the UI —
 *  failures are logged to the console, not surfaced to the visitor. */
export async function recordAcceptance({ remembered = false } = {}) {
  if (!isSupabaseConfigured) return
  try {
    const { error } = await supabase
      .from('acceptance_log')
      .insert({ terms_version: TERMS_VERSION, remembered })
    if (error) console.warn('Could not record acceptance:', error.message)
  } catch (err) {
    console.warn('Could not record acceptance:', err)
  }
}
