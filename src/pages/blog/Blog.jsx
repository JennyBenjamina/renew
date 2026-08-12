import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPublishedPosts } from '../../lib/blog.js'
import Seo from '../../components/Seo.jsx'
import './blog.css'

const SITE = 'https://renewlabslv.com'

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('All')

  useEffect(() => {
    fetchPublishedPosts()
      .then(setPosts)
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(posts.map((p) => p.category))).sort()],
    [posts]
  )
  const visible = cat === 'All' ? posts : posts.filter((p) => p.category === cat)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Renew Research Notes',
    description:
      'Research-use-only reference notes on peptide structure, third-party COA testing, storage and handling, and how to evaluate research-chemical vendors.',
    url: `${SITE}/blog`,
    blogPost: posts.slice(0, 20).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${SITE}/blog/${p.slug}`,
      datePublished: p.published_at,
      author: { '@type': 'Organization', name: p.author || 'Renew' },
    })),
  }

  return (
    <div className="blog">
      <Seo
        title="Research Notes — Peptide Reference & Testing Guides | Renew"
        description="Research-use-only notes on peptide structure and classification, third-party COA testing (HPLC, LC-MS), storage and handling, and evaluating research-peptide vendors."
        canonical={`${SITE}/blog`}
        jsonLd={jsonLd}
      />

      <header className="blog__hero deco-band">
        <div className="container">
          <span className="eyebrow">Research Notes</span>
          <h1>Notes from the lab bench</h1>
          <p>
            Reference material on peptide structure and classification, third-party
            COA testing methods (HPLC, LC-MS), reconstitution and cold-chain
            handling, and how to evaluate research-chemical vendors. Written for
            qualified researchers — strictly informational, not guidance for any
            human or animal use.
          </p>
        </div>
      </header>

      <div className="container blog__body">
        {categories.length > 2 && (
          <div className="blog__filters">
            {categories.map((c) => (
              <button
                key={c}
                className={`chip ${cat === c ? 'is-active' : ''}`}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="blog__empty">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="blog__empty">No posts yet. Check back soon.</p>
        ) : (
          <div className="blog__grid">
            {visible.map((p) => (
              <article className="blogcard" key={p.slug}>
                <Link to={`/blog/${p.slug}`} className="blogcard__link">
                  <span className="blogcard__cat">{p.category}</span>
                  <h2 className="blogcard__title">{p.title}</h2>
                  <p className="blogcard__excerpt">{p.excerpt}</p>
                  <span className="blogcard__meta">
                    {fmtDate(p.published_at)} · {p.read_minutes || 5} min read
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
