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

  useEffect(() => {
    let active = true
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
            <h2>Shop research-grade peptides, ready to order</h2>
            <p>
              Third-party tested for purity with a COA on every batch — packed
              and delivered locally by real people in Las Vegas.
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
        title="One trusted lineup, synthesized for precision"
        body="From GLP-3 RETA and MOTS-c to BPC-157, TB-500, and NAD+, every Renew compound is produced under strict, verified quality controls and third-party tested for purity — labeled for research use only."
        ctaLabel="Shop the collection"
        ctaTo="/products"
        subtle
      />

      <MissionSection />

      <ImageBand
        image="/renew-partner.jpg"
        alt="A content creator reviewing Renew Labs analytics on a laptop dashboard"
        eyebrow="Partner with Renew"
        title="Built for researchers and creators"
        body="Independent researchers, educators, and content creators partner with Renew to share a brand they can stand behind — professional packaging, clean labeling, and compounds backed by verified certificates of analysis."
        ctaLabel="Create an account"
        ctaTo="/signup"
        reverse
      />

      <AffiliateSection />
    </>
  )
}
