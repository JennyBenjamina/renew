import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo />
          <p>
            Research compounds synthesized for precision. Third-party tested for
            verified purity.
          </p>
          <p className="footer__ro">For research purposes only.</p>
        </div>

        <div className="footer__col">
          <h4>Shop</h4>
          <Link to="/catalog">Full Catalog</Link>
          <Link to="/catalog">Featured</Link>
          <Link to="/local-pickup">Local Pickup</Link>
        </div>

        <div className="footer__col">
          <h4>Company</h4>
          <Link to="/about">About</Link>
          <Link to="/about">Quality &amp; Testing</Link>
          <Link to="/about">Affiliate Program</Link>
        </div>

        <div className="footer__col">
          <h4>Compliance</h4>
          <a href="#terms">Research Use Only Terms</a>
          <a href="#coa">Certificates of Analysis</a>
          <a href="#privacy">Privacy Policy</a>
        </div>
      </div>

      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} Renew. All rights reserved.</span>
        <span>
          Products are intended for laboratory research use only and are not for
          human consumption.
        </span>
      </div>
    </footer>
  )
}
