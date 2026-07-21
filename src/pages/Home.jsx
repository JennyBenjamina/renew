import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import ImageBand from '../components/ImageBand.jsx'
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
            <Link to="/products" className="btn btn--outline">
              View Full Catalog
            </Link>
          </div>
        </div>
      </section>

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
