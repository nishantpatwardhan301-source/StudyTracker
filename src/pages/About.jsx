import { site } from '../data/site'

export default function About() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow light">About</span>
          <h1>Prof. {site.name}</h1>
          <p className="lead">{site.role}, Pune</p>
        </div>
      </section>
      <section className="section">
        <div className="container about-grid">
          <div className="card pad about-card">
            <img src="./avatar.jpg" alt={site.name} />
            <div className="about-stats">
              {site.stats.map((s) => (
                <div key={s.label}><strong>{s.value}</strong><span>{s.label}</span></div>
              ))}
            </div>
          </div>
          <div>
            {site.about.map((p) => <p key={p} className="about-p">{p}</p>)}
            <h2 id="contact">Contact</h2>
            <div className="grid grid-2 contact">
              <a className="card pad" href={`tel:+91${site.phone}`}>📞<strong>Call</strong><span>+91 {site.phone}</span></a>
              <a className="card pad" href={site.whatsapp} target="_blank" rel="noreferrer">💬<strong>WhatsApp Channel</strong><span>Updates & announcements</span></a>
              <a className="card pad" href={site.youtube} target="_blank" rel="noreferrer">▶️<strong>YouTube</strong><span>{site.name}</span></a>
              <a className="card pad" href={site.app} target="_blank" rel="noreferrer">📱<strong>Our App</strong><span>DPPs, PYQs & live classes</span></a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
