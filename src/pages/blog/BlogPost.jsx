import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPostBySlug, fetchPublishedPosts } from '../../lib/blog.js'
import { Markdown } from '../../lib/markdown.jsx'
import Seo from '../../components/Seo.jsx'
import './blog.css'

const SITE = 'https://renewlabslv.com'

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(undefined) // undefined = loading, null = not found
  const [related, setRelated] = useState([])

  useEffect(() => {
    let active = true
    setPost(undefined)
    fetchPostBySlug(slug).then((p) => active && setPost(p || null))
    fetchPublishedPosts().then((all) => {
      if (!active) return
      setRelated(all.filter((p) => p.slug !== slug))
    })
    return () => {
      active = false
    }
  }, [slug])

  if (post === undefined) {
    return (
      <div className="container post__status">
        <p>Loading…</p>
      </div>
    )
  }

  if (post === null) {
    return (
      <div className="container post__status">
        <h1>Post not found</h1>
        <p>This research note doesn’t exist or has been unpublished.</p>
        <Link to="/blog" className="btn btn--primary">
          ← All research notes
        </Link>
      </div>
    )
  }

  const url = `${SITE}/blog/${post.slug}`
  const faq = Array.isArray(post.faq) ? post.faq : []
  const sameCat = related.filter((p) => p.category === post.category).slice(0, 3)
  const relatedList = (sameCat.length ? sameCat : related).slice(0, 3)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.meta_description || post.excerpt,
      author: { '@type': 'Organization', name: post.author || 'Renew' },
      publisher: {
        '@type': 'Organization',
        name: 'Renew',
        logo: { '@type': 'ImageObject', url: `${SITE}/og-image.png` },
      },
      datePublished: post.published_at,
      dateModified: post.updated_at || post.published_at,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      keywords: (post.keywords || []).join(', '),
      articleSection: post.category,
      image: post.image_url || `${SITE}/og-image.png`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Research Notes', item: `${SITE}/blog` },
        { '@type': 'ListItem', position: 2, name: post.title, item: url },
      ],
    },
  ]
  if (faq.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    })
  }

  return (
    <article className="post">
      <Seo
        title={post.meta_title || `${post.title} | Renew Research Notes`}
        description={post.meta_description || post.excerpt}
        canonical={url}
        type="article"
        image={post.image_url || undefined}
        jsonLd={jsonLd}
      />

      <header className="post__hero deco-band">
        <div className="post__inner">
          <nav className="post__crumbs" aria-label="Breadcrumb">
            <Link to="/blog">Research Notes</Link>
            <span aria-hidden="true">/</span>
            <span>{post.category}</span>
          </nav>
          <h1>{post.title}</h1>
          <div className="post__byline">
            <span>{post.author || 'Renew Research Team'}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.published_at}>{fmtDate(post.published_at)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.read_minutes || 5} min read</span>
          </div>
        </div>
      </header>

      <div className="post__body">
        {post.excerpt && <p className="post__lede">{post.excerpt}</p>}

        <div className="post__prose">
          <Markdown text={post.body} />
        </div>

        {faq.length > 0 && (
          <section className="post__faq" aria-label="Frequently asked questions">
            <h2>Frequently asked questions</h2>
            {faq.map((f, i) => (
              <details className="post__faq-item" key={i}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </section>
        )}

        <p className="post__disclaimer">
          For laboratory research use only. This material is informational and
          structural; it is not medical guidance and makes no claims for human or
          animal use. Every batch is documented with a third-party certificate of
          analysis.
        </p>

        <div className="post__cta">
          <div>
            <h3>Verified, COA-backed research compounds</h3>
            <p>Browse the Renew catalog — every batch third-party tested.</p>
          </div>
          <Link to="/products" className="btn btn--primary">
            View Products
          </Link>
        </div>
      </div>

      {relatedList.length > 0 && (
        <aside className="post__related">
          <h2>More research notes</h2>
          <div className="blog__grid">
            {relatedList.map((p) => (
              <article className="blogcard" key={p.slug}>
                <Link to={`/blog/${p.slug}`} className="blogcard__link">
                  <span className="blogcard__cat">{p.category}</span>
                  <h3 className="blogcard__title">{p.title}</h3>
                  <span className="blogcard__meta">{p.read_minutes || 5} min read</span>
                </Link>
              </article>
            ))}
          </div>
        </aside>
      )}
    </article>
  )
}
