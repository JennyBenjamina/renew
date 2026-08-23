import { useEffect, useMemo, useState } from 'react'
import { fetchProducts } from '../lib/products.js'
import { coaFor } from '../data/coas.js'
import Seo from '../components/Seo.jsx'
import './coas.css'

const SITE = 'https://renewlabslv.com'

export default function COAs() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products
      .map((p) => ({ product: p, coa: coaFor(p) }))
      .filter(({ product, coa }) => {
        if (!q) return true
        return (
          product.name.toLowerCase().includes(q) ||
          (coa.lot || '').toLowerCase().includes(q)
        )
      })
  }, [products, query])

  return (
    <div className="coa">
      <Seo
        title="Certificates of Analysis (COA) | Renew"
        description="Independent third-party HPLC and LC-MS testing results for every Renew research compound. Find your batch by the lot number on your vial."
        canonical={`${SITE}/coas`}
      />

      <header className="coa__hero deco-band">
        <div className="container">
          <span className="eyebrow">Third-Party Verified</span>
          <h1>Certificates of Analysis</h1>
          <p>
            Independent HPLC and mass-spectrometry (LC-MS) results for every lot.
            Find your batch by the lot number printed on your vial. New results are
            posted here as each batch clears testing.
          </p>
        </div>
      </header>

      <div className="container coa__body">
        <div className="coa__toolbar">
          <input
            type="search"
            className="coa__search"
            placeholder="Search by product or lot number…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search certificates of analysis"
          />
        </div>

        {loading ? (
          <p className="coa__empty">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="coa__empty">No products match your search.</p>
        ) : (
          <div className="coa__table" role="table">
            <div className="coa__row coa__row--head" role="row">
              <span role="columnheader">Product</span>
              <span role="columnheader">Lot</span>
              <span role="columnheader">Purity</span>
              <span role="columnheader">Status</span>
            </div>
            {rows.map(({ product, coa }) => {
              const available = coa.status === 'available' && coa.pdf
              return (
                <div className="coa__row" role="row" key={product.id || product.slug}>
                  <span className="coa__product" role="cell">
                    <span className="coa__name">{product.name}</span>
                    <span className="coa__cat">{product.category}</span>
                  </span>
                  <span className="coa__lot" role="cell">
                    {coa.lot || '—'}
                  </span>
                  <span className="coa__purity" role="cell">
                    {available ? coa.purity || '—' : '—'}
                  </span>
                  <span className="coa__status" role="cell">
                    {available ? (
                      <a
                        className="btn btn--primary coa__view"
                        href={coa.pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View COA
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none"
                          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                          strokeLinejoin="round">
                          <path d="M14 3h7v7M21 3l-9 9M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
                        </svg>
                      </a>
                    ) : (
                      <span className="coa__badge coa__badge--testing">
                        <span className="coa__dot" aria-hidden="true" />
                        In Testing
                      </span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <p className="coa__note">
          Every batch is submitted to an independent, third-party laboratory for
          HPLC purity and LC-MS identity analysis. Results are published here once
          testing is complete. All products are sold strictly for laboratory
          research use only and are not for human or veterinary use.
        </p>
      </div>
    </div>
  )
}
