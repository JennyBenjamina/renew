import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../lib/tracking.js'

/** Scrolls to the top of the page and fires a page view on every route change. */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Block body so the effect always returns undefined (never a stray value
    // that React would try to call as a cleanup function).
    window.scrollTo(0, 0)
    trackPageView()
  }, [pathname])
  return null
}
