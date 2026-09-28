import { Link } from 'react-router-dom'
import { tests, upcomingTests, marksFor } from '../data/tests'
import { questions } from '../data/questions'
import { load } from '../lib/storage'
import { SectionHead } from '../components/Cards'

const qById = Object.fromEntries(questions.map((q) => [q.id, q]))

export const maxMarks = (t) => t.questionIds.reduce((s, id) => s + marksFor(qById[id].subject), 0)

export default function Tests() {
  const attempts = load('np.attempts', [])
  const best = (id) => {
    const a = attempts.filter((x) => x.testId === id)
    return a.length ? Math.max(...a.map((x) => x.score)) : null
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow light">Test Portal</span>
          <h1>Practice in the real MHT-CET pattern</h1>
          <p className="lead">Timed tests with a question palette, mark-for-review and instant analysis with solutions. No negative marking; Maths carries 2 marks per question.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Available now" title="Live tests" />
          <div className="grid grid-3">
            {tests.map((t) => {
              const b = best(t.id)
              return (
                <article key={t.id} className="card pad test-card">
                  <span className={`chip chip-${t.tag.split(' ')[0].toLowerCase()}`}>{t.tag}</span>
                  <h3>{t.title}</h3>
                  <p className="muted">{t.description}</p>
                  <div className="test-meta">
                    <span>⏱ {t.durationMin} min</span>
                    <span>❓ {t.questionIds.length} Qs</span>
                    <span>🎯 {maxMarks(t)} marks</span>
                  </div>
                  <div className="course-foot">
                    <span className="muted small">{b !== null ? `Best: ${b}/${maxMarks(t)}` : 'Not attempted'}</span>
                    <Link to={`/tests/${t.id}`} className="btn btn-primary btn-sm">{b !== null ? 'Reattempt' : 'Start test'}</Link>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <SectionHead eyebrow="Scheduled" title="Upcoming tests" />
          <div className="grid grid-2">
            {upcomingTests.map((u) => (
              <a key={u.title} href={u.href} target="_blank" rel="noreferrer" className="card pad">
                <span className="badge">Upcoming</span>
                <h3>{u.title}</h3>
                <p className="muted">{u.detail}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {attempts.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHead eyebrow="Your history" title="Recent attempts" />
            <div className="card table-wrap">
              <table>
                <thead><tr><th>Test</th><th>Score</th><th>Accuracy</th><th>Date</th></tr></thead>
                <tbody>
                  {attempts.slice(-10).reverse().map((a) => (
                    <tr key={a.at}>
                      <td>{a.title}</td>
                      <td><strong>{a.score}</strong>/{a.max}</td>
                      <td>{a.attempted ? Math.round((a.correct / a.attempted) * 100) : 0}%</td>
                      <td>{new Date(a.at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
