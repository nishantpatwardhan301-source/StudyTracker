import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { site } from '../data/site'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const links = [
  { to: '/courses', label: 'Courses' },
  { to: '/tests', label: 'Test Portal' },
  { to: '/pyqs', label: 'PYQs' },
  { to: '/tracker', label: 'Study Tracker' },
  { to: '/about', label: 'About' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const firstName = (user?.user_metadata?.full_name || user?.email || '').split(/[ @]/)[0]
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
          {user ? (
            <button className="btn btn-ghost btn-sm" title={user.email} onClick={() => { supabase.auth.signOut(); setOpen(false) }}>
              👤 {firstName} · Log out
            </button>
          ) : (
            <NavLink to="/login" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Log in</NavLink>
          )}
          <a className="btn btn-yt btn-sm" href={site.subscribe} target="_blank" rel="noreferrer">
            ▶ Subscribe
          </a>
        </nav>
      </div>
    </header>
  )
}
