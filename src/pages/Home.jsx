import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import MissionSection from '../components/MissionSection.jsx'
import AffiliateSection from '../components/AffiliateSection.jsx'
import { fetchFeaturedProducts } from '../lib/products.js'

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchFeaturedProducts().then((data) => {
      if (active) {
        setFeatured(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <Hero />

      <section className="section" id="featured">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow">Featured products</span>
            <h2>Our most popular research compounds</h2>
            <p>
              Synthesized for maximum purity and precision, and trusted by
              laboratories for reproducible results.
            </p>
          </div>

          {loading ? (
            <p className="grid__empty">Loading catalog…</p>
          ) : (
            <ProductGrid products={featured} />
          )}

          <div style={{ textAlign: 'center', marginTop: 'var(--space-7)' }}>
            <Link to="/catalog" className="btn btn--outline">
              View Full Catalog
            </Link>
          </div>
        </div>
      </section>

      <MissionSection />
      <AffiliateSection />
    </>
  )
}
