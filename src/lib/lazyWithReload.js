import { lazy } from 'react'

/* After a new deploy, a page that was opened before it still asks for the old,
 * renamed code chunks (e.g. StripeCard-<oldhash>.js), which no longer exist —
 * the import fails with "Failed to fetch dynamically imported module".
 * Reloading the page picks up the new deploy. This retries the import by
 * reloading once; a short-lived flag stops it from looping if the failure is
 * something else (e.g. the shopper is offline). */
const FLAG = 'renew.chunkReloadAt'
const WINDOW_MS = 30 * 1000

export function isChunkLoadError(err) {
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk|module script/i.test(
    String(err?.message || err || '')
  )
}

/** Reload once to recover from a stale-deploy chunk error. Returns true if a
 *  reload was started. */
export function reloadForNewDeploy() {
  try {
    const last = Number(sessionStorage.getItem(FLAG))
    if (last && Date.now() - last < WINDOW_MS) return false
    sessionStorage.setItem(FLAG, String(Date.now()))
  } catch {
    /* sessionStorage unavailable — still try one reload */
  }
  window.location.reload()
  return true
}

export function lazyWithReload(factory) {
  return lazy(() =>
    factory().catch((err) => {
      if (isChunkLoadError(err) && reloadForNewDeploy()) {
        // Keep Suspense waiting while the page reloads.
        return new Promise(() => {})
      }
      throw err
    })
  )
}
