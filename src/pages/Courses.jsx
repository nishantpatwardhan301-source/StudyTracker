import { useState } from 'react'
import { featuredCourses, playlists } from '../data/courses'
import { site } from '../data/site'
import { CourseCard, PlaylistCard, SectionHead } from '../components/Cards'

const filters = ['All', 'Physics', 'Chemistry', 'Mathematics', 'Tests', 'Strategy']

export default function Courses() {
  const [filter, setFilter] = useState('All')
  const running = featuredCourses.filter((c) => c.status === 'running')
  const upcoming = featuredCourses.filter((c) => c.status === 'upcoming')
  const aadhar = featuredCourses.find((c) => c.id === 'aadhar')
  const shown = filter === 'All' ? playlists : playlists.filter((p) => p.subject === filter)

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow light">Courses</span>
          <h1>Courses by Prof. Nishant Patwardhan</h1>
          <p className="lead">Live batches, free crash courses and one-shot revisions for MHT-CET 2027.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Enroll now" title="Running courses" />
          <div className="grid grid-3">
            {running.map((c) => <CourseCard key={c.id} c={c} />)}
          </div>
        </div>
      </section>

      {aadhar && (
        <section className="section alt">
          <div className="container">
            <SectionHead eyebrow="Flagship batch" title="Inside the AADHAR Batch">
              Mon–Fri live classes at 6:30 PM, daily DPPs and tests, and a Sunday full mock.
            </SectionHead>
            <div className="grid grid-3">
              {aadhar.modules.map((m, i) => (
                <div key={m.name} className="card pad">
                  <span className="eyebrow">Module 0{i + 1}</span>
                  <h3>{m.name}</h3>
                  <p className="muted">{m.topics}</p>
                </div>
              ))}
            </div>
            <div className="card pad how-to">
              <h3>How to access the app after enrolling</h3>
              <ul className="ticks">
                <li>Android: install the <a href={site.app} target="_blank" rel="noreferrer">MSA App</a> from the Google Play Store.</li>
                <li>Web / iOS: log in at web.classplus.co with your credentials. Org code: <strong>{site.appOrgCode}</strong></li>
                <li>Questions? Call <a href={`tel:+91${site.phone}`}>+91 {site.phone}</a></li>
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Coming soon" title="Upcoming courses" />
          <div className="grid grid-3">
            {upcoming.map((c) => <CourseCard key={c.id} c={c} />)}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <SectionHead eyebrow="100% free on YouTube" title="Free lecture library">
            {playlists.length} playlists covering chapter-wise lectures, crash courses, mock tests and guidance.
          </SectionHead>
          <div className="tabs">
            {filters.map((f) => (
              <button key={f} className={f === filter ? 'tab active' : 'tab'} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
          <div className="grid grid-4">
            {shown.map((p) => <PlaylistCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>
    </>
  )
}
