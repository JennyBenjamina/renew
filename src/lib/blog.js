import { supabase, isSupabaseConfigured } from './supabaseClient'
import { blogPosts as localPosts } from '../data/blogPosts'

/* Data-access layer for the blog ("Research Notes"), mirroring products.js:
 * when Supabase is configured it queries the `blog_posts` table; otherwise it
 * falls back to the bundled starter posts so the blog renders with no backend.
 * Components never touch Supabase directly. */

const byNewest = (a, b) =>
  new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0)

/** Public: all published posts, newest first. */
export async function fetchPublishedPosts() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
    if (error) {
      console.warn('Blog fetch failed, using local posts:', error.message)
      return localPosts.filter((p) => p.published).sort(byNewest)
    }
    return data
  }
  return localPosts.filter((p) => p.published).sort(byNewest)
}

/** Public: one post by slug (RLS returns drafts only to admins). */
export async function fetchPostBySlug(slug) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
    if (error) {
      console.warn('Blog post fetch failed, using local posts:', error.message)
      return localPosts.find((p) => p.slug === slug) || null
    }
    return data
  }
  return localPosts.find((p) => p.slug === slug) || null
}

/* --------------------------------------------------------------------------
 * Admin write operations — require Supabase + a signed-in admin (enforced by
 * row-level security). They throw on error so the admin UI can surface it.
 * ------------------------------------------------------------------------ */

function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add your keys to .env.')
  }
}

export async function adminListPosts() {
  requireSupabase()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function adminGetPost(id) {
  requireSupabase()
  const { data, error } = await supabase.from('blog_posts').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createPost(post) {
  requireSupabase()
  const { data, error } = await supabase.from('blog_posts').insert(post).select().single()
  if (error) throw error
  return data
}

export async function updatePost(id, patch) {
  requireSupabase()
  const { data, error } = await supabase
    .from('blog_posts')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePost(id) {
  requireSupabase()
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) throw error
}

/** Slugify a title for the admin editor. */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/['".,/#!$%^&*;:{}=_`~()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
