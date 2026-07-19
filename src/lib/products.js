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
