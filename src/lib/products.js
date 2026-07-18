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
