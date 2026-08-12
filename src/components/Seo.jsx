import { useEffect } from 'react'

/* Client-side <head> manager (no dependency). Updates the document title, meta
 * description, canonical, and Open Graph / Twitter tags per page, and injects
 * JSON-LD structured data. Structured data (Article, FAQPage, BreadcrumbList) is
 * what answer engines and rich results read — this is the AEO/SEO backbone for
 * the blog. On unmount every change is reverted to the site defaults baked into
 * index.html, so navigating away leaves a clean head. */

const SITE = 'https://renewlabslv.com'

function upsertMeta(selector, attr, key, content, created) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
    created.push(el)
    el.setAttribute('content', content)
    return null // nothing to restore
  }
  const prev = el.getAttribute('content')
  el.setAttribute('content', content)
  return () => el.setAttribute('content', prev ?? '')
}

export default function Seo({
  title,
  description,
  canonical,
  image = `${SITE}/og-image.png`,
  type = 'website',
  jsonLd = null,
}) {
  useEffect(() => {
    const restores = []
    const createdEls = []
    const url = canonical || SITE + window.location.pathname

    const prevTitle = document.title
    if (title) document.title = title
    restores.push(() => (document.title = prevTitle))

    const push = (r) => r && restores.push(r)

    if (description) {
      push(upsertMeta('meta[name="description"]', 'name', 'description', description, createdEls))
      push(upsertMeta('meta[property="og:description"]', 'property', 'og:description', description, createdEls))
      push(upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description, createdEls))
    }
    if (title) {
      push(upsertMeta('meta[property="og:title"]', 'property', 'og:title', title, createdEls))
      push(upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title, createdEls))
    }
    push(upsertMeta('meta[property="og:type"]', 'property', 'og:type', type, createdEls))
    push(upsertMeta('meta[property="og:url"]', 'property', 'og:url', url, createdEls))
    push(upsertMeta('meta[property="og:image"]', 'property', 'og:image', image, createdEls))
    push(upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image, createdEls))

    // Canonical link
    let linkEl = document.head.querySelector('link[rel="canonical"]')
    if (linkEl) {
      const prev = linkEl.getAttribute('href')
      linkEl.setAttribute('href', url)
      restores.push(() => linkEl.setAttribute('href', prev ?? SITE + '/'))
    } else {
      linkEl = document.createElement('link')
      linkEl.setAttribute('rel', 'canonical')
      linkEl.setAttribute('href', url)
      document.head.appendChild(linkEl)
      createdEls.push(linkEl)
    }

    // JSON-LD structured data (one or many objects)
    const ldEls = []
    if (jsonLd) {
      const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd]
      for (const block of blocks) {
        const s = document.createElement('script')
        s.type = 'application/ld+json'
        s.setAttribute('data-seo-jsonld', 'true')
        s.textContent = JSON.stringify(block)
        document.head.appendChild(s)
        ldEls.push(s)
      }
    }

    return () => {
      restores.forEach((r) => r())
      createdEls.forEach((el) => el.remove())
      ldEls.forEach((el) => el.remove())
    }
  }, [title, description, canonical, image, type, JSON.stringify(jsonLd)])

  return null
}
