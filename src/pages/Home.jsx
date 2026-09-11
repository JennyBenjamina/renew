import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductGrid from '../components/ProductGrid.jsx'
import ImageBand from '../components/ImageBand.jsx'
import LocalSection from '../components/LocalSection.jsx'
import MissionSection from '../components/MissionSection.jsx'
import AffiliateSection from '../components/AffiliateSection.jsx'
import { fetchFeaturedProducts } from '../lib/products.js'

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)

  // Catalog + pricing are public — fetch featured products for everyone.
  useEffect(() => {
    let active = true
    setLoading(true)
    fetchFeaturedProducts()
      .then((data) => {
        if (active) setFeatured(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        console.warn('Could not load featured products:', err)
        if (active) setFeatured([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <section className="section" id="featured">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow">Las Vegas · Research compounds</span>
            <h2>Research-grade peptides, third-party tested</h2>
            <p>
              A COA on every batch — packed and delivered locally by real people
              in Las Vegas.
            </p>
          </div>

          {loading ? (
            <p className="grid__empty">Loading products…</p>
          ) : (
            <ProductGrid products={featured} />
          )}
          <div style={{ textAlign: 'center', marginTop: 'var(--space-7)' }}>
            <Link to="/products" className="btn btn--outline">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      <LocalSection />

      <ImageBand
        image="/renew-collection.jpg"
        alt="The full range of Renew Labs research compound vials in a laboratory setting"
        eyebrow="The full range"
        title="One trusted lineup, tested for precision"
        body="From GLP3-RT and MOTS-c to BPC-157, TB-500, and NAD+, every Renew compound is produced under strict, verified quality controls and third-party tested for purity by our certified partner lab, Freedom Diagnostics — labeled for research use only."
        ctaLabel="Shop the collection"
        ctaTo="/products"
        subtle
      />

      <MissionSection />

      <ImageBand
        image="/renew-partner.jpg"
        alt="A researcher reviewing Renew Labs certificates of analysis on a laptop dashboard"
        eyebrow="Partner with Renew"
        title="Built for qualified researchers"
        body="Independent researchers and laboratories partner with Renew for a supplier they can stand behind — professional packaging, clean labeling, and compounds backed by verified third-party certificates of analysis."
        ctaLabel="Create an account"
        ctaTo="/signup"
        reverse
      />

      <AffiliateSection />
    </>
  )
}
