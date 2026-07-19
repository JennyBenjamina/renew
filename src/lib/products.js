import { supabase, isSupabaseConfigured } from './supabaseClient'
import { products as localProducts } from '../data/products'

/* Single data-access layer for products.
 * - If Supabase is configured, it queries the `products` table.
 * - Otherwise it returns the bundled local catalog.
 * Components never talk to Supabase directly — they call these functions,
 * so swapping the backend never touches the UI. */

export async function fetchProducts() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('featured', { ascending: false })
    if (error) {
      console.warn('Supabase fetch failed, using local catalog:', error.message)
      return localProducts
    }
    return data
  }
  return localProducts
}

export async function fetchFeaturedProducts() {
  const all = await fetchProducts()
  return all.filter((p) => p.featured)
}

/* ---------------------------------------------------------------------------
 * Admin write operations. These require Supabase + a signed-in admin; row-level
 * security enforces that on the server. They throw on error so the admin UI can
 * surface it (no silent local fallback here).
 * ------------------------------------------------------------------------- */

function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add your keys to .env.')
  }
}

/** Admin catalog listing — always from Supabase, newest first. */
export async function adminListProducts() {
  requireSupabase()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createProduct(product) {
  requireSupabase()
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProduct(id, patch) {
  requireSupabase()
  const { data, error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  requireSupabase()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

/* Image upload requirements, surfaced in the admin UI. */
export const IMAGE_RULES = {
  accept: ['image/jpeg', 'image/png', 'image/webp'],
  acceptAttr: 'image/jpeg,image/png,image/webp',
  extensions: 'JPG, PNG, or WebP',
  minSize: 800, // px, square
  recommended: '1000 × 1000px',
  maxBytes: 3 * 1024 * 1024, // 3 MB
  maxLabel: '3 MB',
}

/** Uploads a product image to Supabase Storage and returns its public URL.
 *  Validates type and size first; throws a friendly error if they fail. */
export async function uploadProductImage(file, slug = 'item') {
  requireSupabase()

  if (!IMAGE_RULES.accept.includes(file.type)) {
    throw new Error(`Unsupported file type. Use ${IMAGE_RULES.extensions}.`)
  }
  if (file.size > IMAGE_RULES.maxBytes) {
    throw new Error(`Image is too large. Keep it under ${IMAGE_RULES.maxLabel}.`)
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'item'
  const path = `products/${safeSlug}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { cacheControl: '3600', upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}
