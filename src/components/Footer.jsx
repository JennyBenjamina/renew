import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo light />
          <p>
            Research compounds synthesized for precision. Third-party tested for
            verified purity.
          </p>
          <p className="footer__ro">For research purposes only.</p>
        </div>

        <div className="footer__col">
          <h4>Shop</h4>
          <Link to="/products">Full Catalog</Link>
          <Link to="/products">Featured</Link>
          <Link to="/local-pickup">Local Pickup</Link>
        </div>

        <div className="footer__col">
          <h4>Company</h4>
          <Link to="/partner">Partner</Link>
          <Link to="/partner">Quality &amp; Testing</Link>
          <Link to="/partner">Affiliate Program</Link>
        </div>

        <div className="footer__col">
          <h4>Compliance</h4>
          <Link to="/research-use-terms">Research Use Only Terms</Link>
          <Link to="/certificates-of-analysis">Certificates of Analysis</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </div>
      </div>

      <div className="container footer__disclaimer">
        <h4>Renew</h4>
        <p>
          Renew is not a compounding pharmacy under Section 503A, nor an
          outsourcing facility under Section 503B of the Federal Food, Drug, and
          Cosmetic Act. All products available on this site are intended strictly
          for laboratory research purposes only. They are not intended for human
          or animal consumption and are not approved to diagnose, treat, cure, or
          prevent any disease or medical condition. Access to this website and
          the purchase of any products is restricted to individuals 21 years of
          age or older. Trusted by thousands worldwide.
        </p>
      </div>

      <div className="container footer__bottom">
        <span>
          © {new Date().getFullYear()} Renew. All rights reserved.
          {' · '}
          <Link to="/admin" className="footer__admin">
            Admin
          </Link>
        </span>
        <span>
          Products are intended for laboratory research use only and are not for
          human consumption.
        </span>
      </div>
    </footer>
  )
}
