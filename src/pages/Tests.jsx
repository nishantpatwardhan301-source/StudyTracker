import { Link } from 'react-router-dom'
import { supabase, paperLabel, subjectLabel } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useAsync, q as unwrap } from '../lib/useAsync'
import { load } from '../lib/storage'
import { scopes, upcomingTests } from '../data/tests'
import { SectionHead } from '../components/Cards'
import { Loading, ErrorBox, Empty } from '../components/Status'

export default function Tests() {
  const { user } = useAuth()
  const papers = useAsync(() => unwrap(supabase.rpc('paper_summary')), [])
  const history = useAsync(async () => {
    if (!user) return load('np.attempts', [])
    return unwrap(
      supabase.from('test_attempts').select('id, paper_id, scope, score, max_score, correct, attempted, created_at')
        .order('created_at', { ascending: false }).limit(20)
    )
  }, [user?.id])
  const paperById = Object.fromEntries((papers.data || []).map((p) => [p.id, p]))
  const attempts = history.data || []

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow light">Test Portal</span>
          <h1>Attempt real MHT-CET papers online</h1>
          <p className="lead">Every shift of MHT-CET 2026 as a timed mock: full paper or subject-wise, with a question palette, instant score and full solutions. No negative marking.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Previous year papers" title="MHT-CET PCM papers" />
          {papers.error && <ErrorBox error={papers.error} />}
          {papers.loading ? <Loading text="Loading papers…" /> : (papers.data || []).length === 0 ? (
            <Empty>Papers are being added. Please check back soon.</Empty>
          ) : (
            <div className="grid grid-3">
              {papers.data.map((p) => (
                <article key={p.id} className="card pad test-card">
                  <span className="chip chip-full">MHT-CET {p.year}</span>
                  <h3>{paperLabel(p)}</h3>
                  <div className="test-meta">
                    <span>❓ {Number(p.physics) + Number(p.chemistry) + Number(p.maths)} Qs</span>
                    <span>🎯 {p.max_score} marks</span>
                    <span>⏱ {scopes.full.minutes} min</span>
                  </div>
                  <Link to={`/tests/${p.id}/full`} className="btn btn-primary btn-sm full">Start full paper</Link>
                  <div className="scope-row">
                    {['physics', 'chemistry', 'maths'].map((s) => (
                      <Link key={s} to={`/tests/${p.id}/${s}`} className="btn btn-ghost btn-sm">{subjectLabel[s]}</Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
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

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Your history" title="Recent attempts" />
          {!user && (
            <div className="notice">
              Attempts are saved on this device only. <Link to="/login" state={{ from: '/tests' }}>Log in</Link> to keep your history everywhere.
            </div>
          )}
          {attempts.length === 0 ? <Empty>No attempts yet. Pick a paper above to begin.</Empty> : (
            <div className="card table-wrap">
              <table>
                <thead><tr><th>Paper</th><th>Section</th><th>Score</th><th>Accuracy</th><th>Date</th></tr></thead>
                <tbody>
                  {attempts.map((a) => (
                    <tr key={a.id}>
                      <td>{paperLabel(paperById[a.paper_id]) || '—'}</td>
                      <td>{scopes[a.scope]?.label}</td>
                      <td><strong>{a.score}</strong>/{a.max_score}</td>
                      <td>{a.attempted ? Math.round((a.correct / a.attempted) * 100) : 0}%</td>
                      <td>{new Date(a.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
