import { Link } from 'react-router-dom'
import LegalLayout from './LegalLayout.jsx'

export default function CertificatesOfAnalysis() {
  return (
    <LegalLayout
      eyebrow="Renew Quality"
      title="Certificates of Analysis"
      intro="Every batch of Renew research compounds is independently tested. A Certificate of Analysis (COA) documents the identity, concentration, and purity of the material you receive."
    >
      <div className="legal__prose">
        <h2>What a Certificate of Analysis covers</h2>
        <p>
          A COA is a third-party laboratory report issued for a specific
          production batch. Each report typically confirms:
        </p>
        <ul>
          <li>Compound identity and structural confirmation</li>
          <li>Measured concentration against the labeled amount</li>
          <li>Purity percentage and any detected impurities</li>
          <li>Batch or lot number and test date</li>
          <li>The independent laboratory that performed the analysis</li>
        </ul>

        <h2>How testing works</h2>
        <p>
          Samples from each batch are analyzed by accredited third-party
          laboratories using validated analytical methods. Results are tied to
          the batch’s lot number so a report can always be matched to the
          physical vial, which is labeled with dedicated areas for Lot and
          Reconstitution Date.
        </p>

        <h2>Requesting a COA</h2>
        <p>
          A Certificate of Analysis is available for every compound in our
          catalog. To request the report for a specific product or batch, email{' '}
          <a href="mailto:compliance@renewpeptides.com">
            compliance@renewpeptides.com
          </a>{' '}
          with the product name and, if you have it, the lot number printed on
          your vial.
        </p>

        <h2>Reading your results</h2>
        <p>
          Purity is reported as a percentage of the target compound relative to
          detected impurities. Concentration confirms the measured amount matches
          the labeled quantity. If any result falls outside our specification, the
          batch is not released for sale.
        </p>

        <p className="legal__note">
          Certificates of Analysis are provided for informational and research
          documentation purposes only. All products are intended strictly for
          laboratory research use and are not for human or animal consumption.
        </p>

        <div className="legal__cta">
          <h3>Have a batch to verify?</h3>
          <Link to="/catalog" className="btn btn--primary">
            View Catalog
          </Link>
        </div>
      </div>
    </LegalLayout>
  )
}
