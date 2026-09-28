import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { site } from '../data/site'

const links = [
  { to: '/courses', label: 'Courses' },
  { to: '/tests', label: 'Test Portal' },
  { to: '/pyqs', label: 'PYQs' },
  { to: '/tracker', label: 'Study Tracker' },
  { to: '/about', label: 'About' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <img src="./avatar.jpg" alt="" />
          <span>
            <strong>{site.name}</strong>
            <small>{site.role}</small>
          </span>
        </Link>
        <button className="nav-toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
        <nav className={open ? 'nav-links open' : 'nav-links'}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <a className="btn btn-yt btn-sm" href={site.subscribe} target="_blank" rel="noreferrer">
            ▶ Subscribe
          </a>
        </nav>
      </div>
    </header>
  )
}
