/* Referral capture. When a visitor arrives via a rep's link
 * (renewlabslv.com/?ref=CODE), we remember the code in localStorage for 60 days
 * ("last-touch" attribution) so the rep still gets credit if they buy later. */

const KEY = 'renew_ref'
const TTL_MS = 60 * 24 * 60 * 60 * 1000 // 60 days

/** Read ?ref= from the URL and store it (call once on app load). */
export function captureReferralFromUrl() {
  try {
    const ref = (new URLSearchParams(window.location.search).get('ref') || '')
      .trim()
      .toLowerCase()
    if (ref) {
      localStorage.setItem(KEY, JSON.stringify({ code: ref, ts: Date.now() }))
    }
  } catch {
    /* localStorage unavailable — ignore */
  }
}

/** The stored referral code, or null if none / expired. */
export function getStoredReferral() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const { code, ts } = JSON.parse(raw)
    if (!code || Date.now() - ts > TTL_MS) {
      localStorage.removeItem(KEY)
      return null
    }
    return code
  } catch {
    return null
  }
}

export function clearReferral() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
