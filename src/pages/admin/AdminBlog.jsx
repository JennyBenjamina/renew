import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminListPosts, deletePost } from '../../lib/blog.js'
import { isSupabaseConfigured } from '../../lib/supabaseClient.js'
import './admin.css'
import './blogadmin.css'

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function AdminBlog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setPosts(await adminListPosts())
    } catch (err) {
      setError(err.message || 'Could not load posts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSupabaseConfigured) load()
    else setLoading(false)
  }, [])

  const onDelete = async (post) => {
    if (!confirm(`Delete “${post.title}”? This cannot be undone.`)) return
    setBusyId(post.id)
    try {
      await deletePost(post.id)
      setPosts((list) => list.filter((p) => p.id !== post.id))
    } catch (err) {
      alert(err.message || 'Delete failed.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="admin__head">
        <div>
          <h1>Research Notes</h1>
          <p>{posts.length} post{posts.length === 1 ? '' : 's'}</p>
        </div>
        <div className="admin__head-actions">
          <button className="btn btn--outline" onClick={load} disabled={loading || !isSupabaseConfigured}>
            Refresh
          </button>
          <Link to="/admin/blog/new" className="btn btn--primary">
            + New post
          </Link>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="admin-alert">
          Supabase isn’t configured, so the blog is showing the four bundled
          starter posts. Add your Supabase keys and run <code>blog.sql</code> +{' '}
          <code>blog_seed.sql</code> to manage posts here.
        </div>
      )}

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {loading ? (
        <p className="admin__empty">Loading posts…</p>
      ) : posts.length === 0 && isSupabaseConfigured ? (
        <p className="admin__empty">
          No posts yet. Click “New post”, or run <code>blog_seed.sql</code> to load
          the four starter posts.
        </p>
      ) : (
        <div className="blogadmin__list">
          {posts.map((p) => (
            <article className={`blogadmin__row ${busyId === p.id ? 'is-busy' : ''}`} key={p.id || p.slug}>
              <div className="blogadmin__main">
                <div className="blogadmin__titleline">
                  <strong>{p.title}</strong>
                  <span className={`blogadmin__badge ${p.published ? 'is-pub' : 'is-draft'}`}>
                    {p.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <span className="blogadmin__sub">
                  {p.category} · /{p.slug} · updated {fmtDate(p.updated_at || p.published_at)}
                </span>
              </div>
              <div className="blogadmin__actions">
                {p.published && (
                  <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="admin__link">
                    View ↗
                  </a>
                )}
                {p.id && (
                  <>
                    <Link to={`/admin/blog/${p.id}`} className="admin__link">
                      Edit
                    </Link>
                    <button
                      className="admin__link admin__link--danger"
                      disabled={busyId === p.id}
                      onClick={() => onDelete(p)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
