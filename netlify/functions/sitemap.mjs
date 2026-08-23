// Renew — dynamic sitemap.xml
// Lists the static pages plus every PUBLISHED blog post (pulled live from
// Supabase) so search engines and AI crawlers can discover new Research Notes
// automatically. Served at /sitemap.xml via the redirect in netlify.toml.
//
// Uses the Supabase REST endpoint with the public anon key — row-level security
// already restricts anon reads to published posts, so no secret is needed.

const SITE = 'https://renewlabslv.com'

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/products', priority: '0.9', changefreq: 'weekly' },
  { path: '/blog', priority: '0.8', changefreq: 'weekly' },
  { path: '/coas', priority: '0.7', changefreq: 'weekly' },
  { path: '/delivery', priority: '0.6', changefreq: 'monthly' },
  { path: '/partner', priority: '0.6', changefreq: 'monthly' },
  { path: '/faq', priority: '0.6', changefreq: 'monthly' },
  { path: '/certificates-of-analysis', priority: '0.5', changefreq: 'monthly' },
  { path: '/research-use-terms', priority: '0.4', changefreq: 'yearly' },
  { path: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
  { path: '/refund-policy', priority: '0.3', changefreq: 'yearly' },
  { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
]

const xmlEscape = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]))

async function fetchPosts() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return []
  try {
    const res = await fetch(
      `${url}/rest/v1/blog_posts?select=slug,updated_at,published_at&published=eq.true&order=published_at.desc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    )
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function handler() {
  const posts = await fetchPosts()
  const today = new Date().toISOString().slice(0, 10)

  const urls = [
    ...STATIC_ROUTES.map(
      (r) =>
        `  <url><loc>${SITE}${r.path}</loc><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`
    ),
    ...posts.map((p) => {
      const lastmod = (p.updated_at || p.published_at || today).slice(0, 10)
      return `  <url><loc>${SITE}/blog/${xmlEscape(p.slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
    }),
  ].join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
    body: xml,
  }
}
