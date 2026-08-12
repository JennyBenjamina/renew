/* Marketing analytics — Meta Pixel, TikTok Pixel, Microsoft Clarity.
 * Everything is env-gated: a tracker only loads if its ID is set, so nothing
 * runs (and no network calls fire) until you add the IDs in your env.
 *
 *   VITE_META_PIXEL_ID     Meta/Facebook Pixel ID
 *   VITE_TIKTOK_PIXEL_ID   TikTok Pixel ID
 *   VITE_CLARITY_ID        Microsoft Clarity project ID
 */

const META_ID = import.meta.env.VITE_META_PIXEL_ID
const TIKTOK_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID
const CLARITY_ID = import.meta.env.VITE_CLARITY_ID

let started = false

export function initTracking() {
  if (started || typeof window === 'undefined') return
  started = true

  // --- Meta / Facebook Pixel ---
  if (META_ID) {
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      }
      if (!f._fbq) f._fbq = n
      n.push = n
      n.loaded = !0
      n.version = '2.0'
      n.queue = []
      t = b.createElement(e)
      t.async = !0
      t.src = v
      s = b.getElementsByTagName(e)[0]
      s.parentNode.insertBefore(t, s)
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
    window.fbq('init', META_ID)
    window.fbq('track', 'PageView')
    /* eslint-enable */
  }

  // --- TikTok Pixel ---
  if (TIKTOK_ID) {
    /* eslint-disable */
    !(function (w, d, t) {
      w.TiktokAnalyticsObject = t
      var ttq = (w[t] = w[t] || [])
      ttq.methods = ['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie']
      ttq.setAndDefer = function (t, e) {
        t[e] = function () {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)))
        }
      }
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i])
      ttq.instance = function (t) {
        for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n])
        return e
      }
      ttq.load = function (e, n) {
        var r = 'https://analytics.tiktok.com/i18n/pixel/events.js'
        ttq._i = ttq._i || {}
        ttq._i[e] = []
        ttq._i[e]._u = r
        ttq._t = ttq._t || {}
        ttq._t[e] = +new Date()
        ttq._o = ttq._o || {}
        ttq._o[e] = n || {}
        var o = d.createElement('script')
        o.type = 'text/javascript'
        o.async = !0
        o.src = r + '?sdkid=' + e + '&lib=' + t
        var a = d.getElementsByTagName('script')[0]
        a.parentNode.insertBefore(o, a)
      }
      ttq.load(TIKTOK_ID)
      ttq.page()
    })(window, document, 'ttq')
    /* eslint-enable */
  }

  // --- Microsoft Clarity ---
  if (CLARITY_ID) {
    /* eslint-disable */
    ;(function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () {
        ;(c[a].q = c[a].q || []).push(arguments)
      }
      t = l.createElement(r)
      t.async = 1
      t.src = 'https://www.clarity.ms/tag/' + i
      y = l.getElementsByTagName(r)[0]
      y.parentNode.insertBefore(t, y)
    })(window, document, 'clarity', 'script', CLARITY_ID)
    /* eslint-enable */
  }
}

/** Fire a page view (call on route change). */
export function trackPageView() {
  if (window.fbq) window.fbq('track', 'PageView')
  if (window.ttq) window.ttq.page()
}

export function trackAddToCart(item) {
  const p = {
    value: Number(item?.price) || 0,
    currency: 'USD',
    content_ids: item ? [item.id] : [],
    content_type: 'product',
    content_name: item?.name,
  }
  if (window.fbq) window.fbq('track', 'AddToCart', p)
  if (window.ttq) window.ttq.track('AddToCart', p)
}

export function trackInitiateCheckout(items = [], subtotal = 0) {
  const p = {
    value: Number(subtotal) || 0,
    currency: 'USD',
    num_items: items.reduce((n, i) => n + (i.qty || 1), 0),
    content_ids: items.map((i) => i.id),
    content_type: 'product',
  }
  if (window.fbq) window.fbq('track', 'InitiateCheckout', p)
  if (window.ttq) window.ttq.track('InitiateCheckout', p)
}

export function trackPurchase({ items = [], total = 0, orderNumber } = {}) {
  const p = {
    value: Number(total) || 0,
    currency: 'USD',
    content_ids: items.map((i) => i.id),
    content_type: 'product',
    num_items: items.reduce((n, i) => n + (i.qty || 1), 0),
    order_id: orderNumber,
  }
  if (window.fbq) window.fbq('track', 'Purchase', p)
  if (window.ttq) window.ttq.track('CompletePayment', p)
}
