import { supabase, isSupabaseConfigured } from './supabaseClient'

const TZ = 'America/Los_Angeles'

/** UTC Date for the start (00:00) of a Pacific-time day, `daysAgo` days back.
 *  Uses the current Pacific offset (PST/PDT), so cutoffs land on Pacific
 *  midnight rather than UTC midnight. */
export function pacificDayStart(daysAgo = 0) {
  const now = new Date()
  // Pacific calendar Y/M/D right now
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const y = +parts.find((p) => p.type === 'year').value
  const mo = +parts.find((p) => p.type === 'month').value
  const d = +parts.find((p) => p.type === 'day').value

  // Current Pacific UTC offset, e.g. "GMT-8" (PST) or "GMT-7" (PDT)
  const off = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(now)
    .find((p) => p.type === 'timeZoneName').value
  const m = off.match(/GMT([+-]\d+)/)
  const offHours = m ? parseInt(m[1], 10) : -8

  // Pacific midnight of (day - daysAgo) expressed as a UTC instant.
  const utcMidnight = Date.UTC(y, mo - 1, d - daysAgo, 0, 0, 0)
  return new Date(utcMidnight - offHours * 3600 * 1000)
}

/** Format a Date as a Pacific-time label. */
export function formatPacific(date, opts = {}) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    ...opts,
  }).format(date)
}

async function countSince(sinceDate) {
  let q = supabase
    .from('acceptance_log')
    .select('*', { count: 'exact', head: true })
  if (sinceDate) q = q.gte('accepted_at', sinceDate.toISOString())
  const { count, error } = await q
  if (error) throw error
  return count || 0
}

/** Entry counts from the compliance acceptance log, with Pacific-time cutoffs. */
export async function adminGetEntryStats() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.')
  const [total, today, week, month] = await Promise.all([
    countSince(null),
    countSince(pacificDayStart(0)),
    countSince(pacificDayStart(6)), // today + previous 6 days
    countSince(pacificDayStart(29)), // today + previous 29 days
  ])
  return {
    total,
    today,
    week,
    month,
    todayCutoff: pacificDayStart(0),
    weekCutoff: pacificDayStart(6),
    monthCutoff: pacificDayStart(29),
    asOf: new Date(),
  }
}
