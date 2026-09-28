import { Link } from 'react-router-dom'
import { site } from '../data/site'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand">
            <img src="./avatar.jpg" alt="" />
            <span>
              <strong>{site.name}</strong>
              <small>{site.academy}, Pune</small>
            </span>
          </div>
          <p className="muted">{site.intro}</p>
        </div>
        <div>
          <h4>Learn</h4>
          <Link to="/courses">Courses</Link>
          <Link to="/tests">Test Portal</Link>
          <Link to="/pyqs">PYQ Portal</Link>
          <Link to="/tracker">Study Tracker</Link>
        </div>
        <div>
          <h4>Connect</h4>
          <a href={site.youtube} target="_blank" rel="noreferrer">YouTube</a>
          <a href={site.whatsapp} target="_blank" rel="noreferrer">WhatsApp Channel</a>
          <a href={site.app} target="_blank" rel="noreferrer">MSA App (Android)</a>
          <a href={`tel:+91${site.phone}`}>📞 +91 {site.phone}</a>
        </div>
      </div>
      <div className="container footer-bottom muted">
        © {new Date().getFullYear()} {site.name} · {site.academy}
      </div>
    </footer>
  )
}
