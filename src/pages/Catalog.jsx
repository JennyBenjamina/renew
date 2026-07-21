import { useEffect, useMemo, useState } from 'react'
import ProductGrid from '../components/ProductGrid.jsx'
import { fetchProducts } from '../lib/products.js'
import { categories } from '../data/products.js'
import './Catalog.css'

export default function Catalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('featured')
  const [inStockOnly, setInStockOnly] = useState(false)

  useEffect(() => {
    let active = true
    fetchProducts().then((data) => {
      if (active) {
        setProducts(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const visible = useMemo(() => {
    let list = [...products]
    if (category !== 'All') list = list.filter((p) => p.category === category)
    if (inStockOnly) list = list.filter((p) => p.in_stock)

    const within = {
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      name: (a, b) => a.name.localeCompare(b.name),
      featured: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0),
    }[sort]

    list.sort((a, b) => {
      // In-stock products always come first, then apply the chosen sort.
      if (a.in_stock !== b.in_stock) return a.in_stock ? -1 : 1
      return within ? within(a, b) : 0
    })
    return list
  }, [products, category, sort, inStockOnly])

  return (
    <div className="catalog">
      <header className="catalog__hero deco-band">
        <div className="container">
          <span className="eyebrow">All products</span>
          <h1>Research compounds &amp; peptides</h1>
          <p>
            Every compound is third-party tested for verified purity. For
            research purposes only — not for human consumption.
          </p>
        </div>
      </header>

      <div className="container catalog__body">
        <div className="catalog__toolbar">
          <div className="catalog__cats">
            {categories.map((c) => (
              <button
                key={c}
                className={`chip ${category === c ? 'is-active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="catalog__controls">
            <label className="catalog__stock">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              In stock only
            </label>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">Sort: In stock first</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A–Z</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="grid__empty">Loading products…</p>
        ) : (
          <ProductGrid products={visible} />
        )}
      </div>
    </div>
  )
}
