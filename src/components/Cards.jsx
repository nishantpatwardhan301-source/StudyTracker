import { Link } from 'react-router-dom'
import { thumb, watchUrl, playlistUrl } from '../data/site'

export function VideoCard({ id, title }) {
  return (
    <a className="card video-card" href={watchUrl(id)} target="_blank" rel="noreferrer">
      <div className="thumb">
        <img src={thumb(id)} alt="" loading="lazy" />
        <span className="play">▶</span>
      </div>
      <p className="video-title">{title}</p>
    </a>
  )
}

export function PlaylistCard({ p }) {
  return (
    <a className="card video-card" href={playlistUrl(p.id)} target="_blank" rel="noreferrer">
      <div className="thumb">
        <img src={thumb(p.thumb)} alt="" loading="lazy" />
        <span className="count">▤ {p.count} videos</span>
      </div>
      <p className="video-title">{p.title}</p>
      <span className={`chip chip-${p.subject.toLowerCase()}`}>{p.subject}</span>
    </a>
  )
}

function Action({ a, className }) {
  if (!a) return null
  return a.to ? (
    <Link className={className} to={a.to}>{a.label}</Link>
  ) : (
    <a className={className} href={a.href} target="_blank" rel="noreferrer">{a.label}</a>
  )
}

export function CourseCard({ c, compact = false }) {
  return (
    <article className="card course-card">
      <div className="thumb">
        <img src={thumb(c.thumbVideo)} alt="" loading="lazy" />
        <span className={`status status-${c.status}`}>{c.status === 'running' ? '● Running' : 'Upcoming'}</span>
      </div>
      <div className="course-body">
        {c.badge && <span className="badge">{c.badge}</span>}
        <h3>{c.title}</h3>
        <p className="muted">{c.subtitle}</p>
        {!compact && (
          <ul className="ticks">
            {c.highlights.map((h) => <li key={h}>{h}</li>)}
          </ul>
        )}
        <div className="course-foot">
          <div className="price">
            <strong>{c.price}</strong>
            {c.mrp && <s>{c.mrp}</s>}
          </div>
          <div className="actions">
            <Action a={c.secondary} className="btn btn-ghost btn-sm" />
            <Action a={c.cta} className="btn btn-primary btn-sm" />
          </div>
        </div>
      </div>
    </article>
  )
}

export function SectionHead({ eyebrow, title, children, action }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {children && <p className="muted">{children}</p>}
      </div>
      {action}
    </div>
  )
}
