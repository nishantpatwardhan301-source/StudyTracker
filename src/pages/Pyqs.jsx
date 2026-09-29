import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase, SUBJECTS } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useAsync, q as unwrap } from '../lib/useAsync'
import { localChapterProgress } from '../lib/pyqLocal'
import { Loading, ErrorBox, Empty } from '../components/Status'

const SUBJECT_ICON = { physics: '⚛️', chemistry: '🧪', maths: '📐' }

export default function Pyqs() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const subject = params.get('subject') || 'physics'

  const chapters = useAsync(() => unwrap(supabase.rpc('chapter_summary')), [])
  const progress = useAsync(async () => {
    if (!user) return localChapterProgress()
    const rows = await unwrap(supabase.rpc('my_chapter_progress'))
    return Object.fromEntries(rows.map((r) => [r.chapter_id, { attempted: Number(r.attempted), correct: Number(r.correct) }]))
  }, [user?.id])

  const all = chapters.data || []
  const totals = useMemo(() => {
    const t = {}
    for (const c of all) t[c.subject] = (t[c.subject] || 0) + Number(c.question_count)
    return t
  }, [all])
  const list = all.filter((c) => c.subject === subject && c.question_count > 0)
  const prog = progress.data || {}
  const done = list.reduce((n, c) => n + (prog[c.id]?.attempted || 0), 0)
  const total = totals[subject] || 0

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow light">PYQ Portal</span>
          <h1>MHT-CET Chapter-wise PYQs</h1>
          <p className="lead">Every question from all 14 shifts of MHT-CET 2026 with detailed solutions. See how other students answered each question.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {!user && (
            <div className="notice">
              Your progress is saved on this device. <Link to="/login" state={{ from: '/pyqs' }}>Log in</Link> to keep it across devices.
            </div>
          )}

          <div className="subject-switch">
            {SUBJECTS.map((s) => (
              <button key={s.key} className={s.key === subject ? 'subject-pill active' : 'subject-pill'} onClick={() => setParams({ subject: s.key })}>
                <span className="subject-ico">{SUBJECT_ICON[s.key]}</span>
                <span>
                  <strong>{s.label}</strong>
                  <small>{totals[s.key] || 0} Qs</small>
                </span>
              </button>
            ))}
          </div>

          {chapters.error && <ErrorBox error={chapters.error} />}
          {chapters.loading ? <Loading text="Loading chapters…" /> : total === 0 ? (
            <Empty>PYQs are being added. Please check back soon.</Empty>
          ) : (
            <>
              <div className="subject-progress card pad">
                <div>
                  <strong>{done} / {total}</strong> questions attempted
                </div>
                <div className="bar"><div style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
              </div>
              {[12, 11].map((std) => {
                const rows = list.filter((c) => c.standard === std)
                if (!rows.length) return null
                return (
                  <div key={std} className="chapter-group">
                    <h2 className="h3">Class {std}th</h2>
                    <div className="chapter-grid">
                      {rows.map((c) => {
                        const p = prog[c.id] || { attempted: 0, correct: 0 }
                        const n = Number(c.question_count)
                        return (
                          <Link key={c.id} to={`/pyqs/${c.id}`} className="card chapter-card">
                            <div className="chapter-card-top">
                              <strong>{c.name}</strong>
                              <span className="chip">{n} Qs</span>
                            </div>
                            <div className="bar thin"><div style={{ width: `${(p.attempted / n) * 100}%` }} /></div>
                            <div className="chapter-card-meta small muted">
                              <span>{p.attempted}/{n} attempted</span>
                              {p.attempted > 0 && <span>{Math.round((p.correct / p.attempted) * 100)}% accuracy</span>}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </section>
    </>
  )
}
