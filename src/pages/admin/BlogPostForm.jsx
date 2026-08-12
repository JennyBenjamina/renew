import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { adminGetPost, createPost, updatePost, slugify } from '../../lib/blog.js'
import { BLOG_CATEGORIES } from '../../data/blogPosts.js'
import './admin.css'
import './blogadmin.css'

const today = () => new Date().toISOString().slice(0, 10)

const empty = {
  title: '',
  slug: '',
  category: BLOG_CATEGORIES[0],
  author: 'Renew Research Team',
  excerpt: '',
  body: '',
  faq: [],
  keywords: [],
  meta_title: '',
  meta_description: '',
  image_url: '',
  read_minutes: 5,
  published: false,
  published_at: today(),
}

export default function BlogPostForm() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isNew) return
    adminGetPost(id)
      .then((p) =>
        setForm({
          ...empty,
          ...p,
          keywords: p.keywords || [],
          faq: Array.isArray(p.faq) ? p.faq : [],
          published_at: (p.published_at || today()).slice(0, 10),
        })
      )
      .catch((e) => setError(e.message || 'Could not load post.'))
      .finally(() => setLoading(false))
  }, [id, isNew])

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const setFaq = (i, key) => (e) =>
    setForm((f) => {
      const faq = f.faq.map((row, idx) => (idx === i ? { ...row, [key]: e.target.value } : row))
      return { ...f, faq }
    })
  const addFaq = () => setForm((f) => ({ ...f, faq: [...f.faq, { q: '', a: '' }] }))
  const removeFaq = (i) => setForm((f) => ({ ...f, faq: f.faq.filter((_, idx) => idx !== i) }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const slug = (form.slug && slugify(form.slug)) || slugify(form.title)
    if (!form.title.trim()) return setError('Title is required.')
    if (!slug) return setError('A slug (or title) is required.')

    const keywords = Array.isArray(form.keywords)
      ? form.keywords
      : String(form.keywords)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)

    const payload = {
      slug,
      title: form.title.trim(),
      category: form.category,
      author: form.author.trim() || 'Renew Research Team',
      excerpt: form.excerpt.trim(),
      body: form.body,
      faq: (form.faq || []).filter((f) => f.q.trim() || f.a.trim()),
      keywords,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      image_url: form.image_url.trim() || null,
      read_minutes: Number(form.read_minutes) || 5,
      published: Boolean(form.published),
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
    }

    setSaving(true)
    try {
      if (isNew) await createPost(payload)
      else await updatePost(id, payload)
      navigate('/admin/blog')
    } catch (err) {
      setError(err.message || 'Save failed.')
      setSaving(false)
    }
  }

  // keywords as comma string for the input
  const keywordString = Array.isArray(form.keywords) ? form.keywords.join(', ') : form.keywords

  if (loading) return <p className="admin__empty">Loading…</p>

  return (
    <form className="blogform" onSubmit={onSubmit}>
      <div className="admin__head">
        <div>
          <h1>{isNew ? 'New research note' : 'Edit research note'}</h1>
          <p>
            <Link to="/admin/blog" className="admin__link">
              ← Back to Research Notes
            </Link>
          </p>
        </div>
        <div className="admin__head-actions">
          <label className="blogform__pubtoggle">
            <input type="checkbox" checked={form.published} onChange={set('published')} />
            Published
          </label>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Create post' : 'Save changes'}
          </button>
        </div>
      </div>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <div className="blogform__grid">
        <label className="blogform__full">
          Title
          <input value={form.title} onChange={set('title')} required
            placeholder="What Is BPC-157? Peptide Class, Sequence, and Handling" />
        </label>

        <label>
          Slug {isNew ? '(auto from title if blank)' : ''}
          <input value={form.slug} onChange={set('slug')}
            placeholder={isNew ? 'auto' : ''} />
        </label>
        <label>
          Category
          <select value={form.category} onChange={set('category')}>
            {BLOG_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label>
          Author
          <input value={form.author} onChange={set('author')} />
        </label>
        <label>
          Read time (minutes)
          <input type="number" min="1" value={form.read_minutes} onChange={set('read_minutes')} />
        </label>

        <label>
          Publish date
          <input type="date" value={form.published_at} onChange={set('published_at')} />
        </label>
        <label>
          Header image URL (optional)
          <input value={form.image_url} onChange={set('image_url')} placeholder="https://…" />
        </label>

        <label className="blogform__full">
          Excerpt / summary (shown on cards + used as meta description fallback)
          <textarea rows={2} value={form.excerpt} onChange={set('excerpt')} />
        </label>

        <label className="blogform__full">
          Body (Markdown: <code>## Heading</code>, <code>- list</code>, <code>**bold**</code>, <code>[link](url)</code>)
          <textarea className="blogform__body" rows={18} value={form.body} onChange={set('body')} />
        </label>

        <div className="blogform__full blogform__section">
          <div className="blogform__section-head">
            <h2>FAQ <span>(emitted as FAQ structured data — great for Google + AI answers)</span></h2>
            <button type="button" className="btn btn--outline" onClick={addFaq}>+ Add question</button>
          </div>
          {form.faq.length === 0 && <p className="blogform__hint">No FAQ yet. Add 2–4 questions to boost AEO.</p>}
          {form.faq.map((row, i) => (
            <div className="blogform__faqrow" key={i}>
              <input placeholder="Question" value={row.q} onChange={setFaq(i, 'q')} />
              <textarea placeholder="Answer" rows={2} value={row.a} onChange={setFaq(i, 'a')} />
              <button type="button" className="admin__link admin__link--danger" onClick={() => removeFaq(i)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="blogform__full blogform__section">
          <h2>SEO</h2>
          <label className="blogform__full">
            Keywords (comma-separated)
            <input value={keywordString}
              onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))}
              placeholder="what is BPC-157, BPC-157 sequence, BPC-157 molecular weight" />
          </label>
          <label className="blogform__full">
            Meta title (defaults to “Title | Renew Research Notes”)
            <input value={form.meta_title} onChange={set('meta_title')} />
          </label>
          <label className="blogform__full">
            Meta description (~155 chars; defaults to the excerpt)
            <textarea rows={2} value={form.meta_description} onChange={set('meta_description')} />
          </label>
        </div>
      </div>

      <footer className="blogform__foot">
        <Link to="/admin/blog" className="btn btn--ghost">Cancel</Link>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Saving…' : isNew ? 'Create post' : 'Save changes'}
        </button>
      </footer>
    </form>
  )
}
