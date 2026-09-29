import { Link } from 'react-router-dom'
import { site, latestVideos } from '../data/site'
import { featuredCourses } from '../data/courses'
import { VideoCard, CourseCard, SectionHead } from '../components/Cards'

const portals = [
  { to: '/courses', icon: '🎓', title: 'Courses', text: 'Running and upcoming batches, plus 29 free playlists.', color: 'var(--brand)' },
  { to: '/tests', icon: '📝', title: 'Test Portal', text: 'Attempt real MHT-CET 2026 shift papers as timed mocks with instant analysis.', color: 'var(--physics)' },
  { to: '/pyqs', icon: '📚', title: 'PYQ Portal', text: '2,100 real MHT-CET PYQs, chapter-wise, with explanations.', color: 'var(--chemistry)' },
  { to: '/tracker', icon: '📈', title: 'Study Tracker', text: 'Track lectures, notes, PYQs and revision chapter by chapter.', color: 'var(--maths)' },
]

export default function Home() {
  const running = featuredCourses.filter((c) => c.status === 'running').slice(0, 3)
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow light">MHT-CET · JEE · NEET · Boards</span>
            <h1>
              {site.tagline}, with <span className="hl">Prof. {site.name}</span>
            </h1>
            <p className="lead">{site.intro}</p>
            <div className="hero-actions">
              <Link to="/courses" className="btn btn-accent">Explore courses</Link>
              <Link to="/tests" className="btn btn-outline-light">Take a free test</Link>
            </div>
            <div className="hero-meta">
              <span>🏆 MHT-CET 2010: 196/200</span>
              <span>🎓 B.Tech, COEP Pune</span>
            </div>
          </div>
          <div className="hero-card">
            <img src="./avatar.jpg" alt={site.name} />
            <div>
              <strong>{site.name}</strong>
              <span>{site.role}</span>
            </div>
            <a className="btn btn-yt" href={site.subscribe} target="_blank" rel="noreferrer">▶ Subscribe on YouTube</a>
          </div>
        </div>
        <div className="container stats">
          {site.stats.map((s) => (
            <div key={s.label} className="stat">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Everything free in one place" title="Your MHT-CET preparation hub" />
          <div className="grid grid-4">
            {portals.map((p) => (
              <Link key={p.to} to={p.to} className="card portal" style={{ '--c': p.color }}>
                <span className="portal-icon">{p.icon}</span>
                <h3>{p.title}</h3>
                <p className="muted">{p.text}</p>
                <span className="portal-go">Open →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <SectionHead
            eyebrow="Courses"
            title="Running now"
            action={<Link to="/courses" className="btn btn-ghost">All courses →</Link>}
          />
          <div className="grid grid-3">
            {running.map((c) => <CourseCard key={c.id} c={c} compact />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead
            eyebrow="Fresh on YouTube"
            title="Latest videos"
            action={<a className="btn btn-ghost" href={site.youtube} target="_blank" rel="noreferrer">View channel →</a>}
          />
          <div className="grid grid-4">
            {latestVideos.map((v) => <VideoCard key={v.id} {...v} />)}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container cta-band">
          <div>
            <h2>Start solving PYQs today</h2>
            <p className="muted">
              Real MHT-CET questions from every 2026 shift with step-by-step explanations, organised by chapter. Free, no login needed.
            </p>
          </div>
          <div className="hero-actions">
            <Link to="/pyqs" className="btn btn-primary">Open PYQ Portal</Link>
            <a href={site.whatsapp} className="btn btn-ghost" target="_blank" rel="noreferrer">Join WhatsApp channel</a>
          </div>
        </div>
      </section>
    </>
  )
}
