import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, QUESTION_COLUMNS, optionsOf, LETTERS, paperLabel, subjectLabel } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useAsync, q as unwrap } from '../lib/useAsync'
import { load, save } from '../lib/storage'
import { scopes } from '../data/tests'
import { Loading, ErrorBox, Rich } from '../components/Status'

const SUBJECT_ORDER = { physics: 0, chemistry: 1, maths: 2 }

function fmt(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TestRunner() {
  const { paperId, scope = 'full' } = useParams()
  const { user } = useAuth()
  const cfg = scopes[scope]

  const data = useAsync(async () => {
    const [paper] = await unwrap(supabase.rpc('paper_summary').eq('id', paperId))
    let query = supabase.from('questions').select(QUESTION_COLUMNS).eq('paper_id', paperId)
    if (scope !== 'full') query = query.eq('subject', scope)
    const rows = await unwrap(query.order('question_number').limit(200))
    rows.sort((a, b) => SUBJECT_ORDER[a.subject] - SUBJECT_ORDER[b.subject] || a.question_number - b.question_number)
    return { paper, qs: rows }
  }, [paperId, scope])

  const paper = data.data?.paper
  const qs = useMemo(() => data.data?.qs || [], [data.data])
  const maxMarks = qs.reduce((s, x) => s + x.marks, 0)

  const [phase, setPhase] = useState('intro') // intro | running | submitting | result
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({}) // qid -> 'A'..'D'
  const [marked, setMarked] = useState({})
  const [visited, setVisited] = useState({})
  const [endAt, setEndAt] = useState(null)
  const [now, setNow] = useState(Date.now())
  const startedAt = useRef(null)
  const [result, setResult] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  const submit = useCallback(async () => {
    setPhase('submitting')
    const timeSec = Math.round((Date.now() - startedAt.current) / 1000)
    const { data: r, error } = await supabase.rpc('submit_test', {
      p_paper_id: paperId, p_scope: scope, p_answers: answers, p_time_seconds: timeSec,
    })
    if (error) { setSubmitError(error); setPhase('running'); return }
    r.timeSec = timeSec
    if (!user) {
      save('np.attempts', [
        { id: String(Date.now()), paper_id: paperId, scope, score: r.score, max_score: r.max_score,
          correct: r.correct, attempted: r.attempted, created_at: new Date().toISOString() },
        ...load('np.attempts', []),
      ].slice(0, 20))
    }
    setResult(r)
    setPhase('result')
    window.scrollTo(0, 0)
  }, [paperId, scope, answers, user])

  useEffect(() => {
    if (phase !== 'running') return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [phase])

  const remaining = endAt ? Math.max(0, Math.round((endAt - now) / 1000)) : 0
  useEffect(() => {
    if (phase === 'running' && endAt && remaining === 0) submit()
  }, [phase, endAt, remaining, submit])

  useEffect(() => {
    if (phase === 'running' && qs[idx]) setVisited((v) => ({ ...v, [qs[idx].id]: true }))
  }, [phase, idx, qs])

  if (!cfg) return <section className="section"><div className="container"><ErrorBox error="Unknown test type" /></div></section>
  if (data.loading) return <section className="section"><div className="container narrow"><Loading text="Loading paper…" /></div></section>
  if (data.error || !paper || qs.length === 0) {
    return (
      <section className="section"><div className="container empty">
        <h1 className="h2">Paper not available</h1>
        {data.error && <ErrorBox error={data.error} />}
        <Link to="/tests" className="btn btn-primary">Back to tests</Link>
      </div></section>
    )
  }
  const title = `MHT-CET ${paperLabel(paper)} · ${cfg.label}`

  if (phase === 'intro') {
    const subjects = [...new Set(qs.map((x) => x.subject))]
    return (
      <section className="section">
        <div className="container narrow">
          <div className="card pad">
            <span className="eyebrow">Instructions</span>
            <h1 className="h2">{title}</h1>
            <div className="test-meta big">
              <span>⏱ {cfg.minutes} minutes</span>
              <span>❓ {qs.length} questions</span>
              <span>🎯 {maxMarks} marks</span>
            </div>
            <ul className="ticks">
              <li>Subjects: {subjects.map((s) => subjectLabel[s]).join(', ')}.</li>
              <li>Physics & Chemistry: +1 per correct answer. Mathematics: +2 per correct answer.</li>
              <li>No negative marking, so attempt every question.</li>
              <li>Use the palette to jump between questions. “Mark for review” flags a question to revisit.</li>
              <li>The test auto-submits when the timer ends.</li>
              {!user && <li><Link to="/login" state={{ from: `/tests/${paperId}/${scope}` }}>Log in</Link> first if you want this attempt saved to your account.</li>}
            </ul>
            <button className="btn btn-primary" onClick={() => {
              const t = Date.now()
              startedAt.current = t; setEndAt(t + cfg.minutes * 60 * 1000); setNow(t); setPhase('running')
            }}>
              I’m ready, start test
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (phase === 'result') {
    const r = result
    const pct = r.max_score ? Math.round((r.score / r.max_score) * 100) : 0
    return (
      <section className="section">
        <div className="container">
          <div className="card pad result-hero">
            <div className="ring" style={{ '--p': pct }}><span>{pct}%</span></div>
            <div>
              <span className="eyebrow">Result · {title}</span>
              <h1 className="h2">{r.score} / {r.max_score} marks</h1>
              <div className="test-meta">
                <span>✅ {r.correct} correct</span>
                <span>❌ {r.attempted - r.correct} wrong</span>
                <span>⏭ {r.total - r.attempted} skipped</span>
                <span>⏱ {fmt(r.timeSec)}</span>
                <span>🎯 Accuracy {r.attempted ? Math.round((r.correct / r.attempted) * 100) : 0}%</span>
              </div>
              <div className="hero-actions">
                <Link className="btn btn-primary btn-sm" to="/tests">All tests</Link>
                <Link className="btn btn-ghost btn-sm" to="/tracker">Update Study Tracker</Link>
              </div>
            </div>
          </div>

          <div className="grid grid-3 mt">
            {Object.entries(r.per_subject).sort(([a], [b]) => SUBJECT_ORDER[a] - SUBJECT_ORDER[b]).map(([s, v]) => (
              <div key={s} className="card pad">
                <span className={`chip chip-${s === 'maths' ? 'mathematics' : s}`}>{subjectLabel[s]}</span>
                <h3>{v.score} / {v.max}</h3>
                <div className="bar"><div style={{ width: `${v.max ? (v.score / v.max) * 100 : 0}%` }} /></div>
                <p className="muted small">{v.correct} correct · {v.wrong} wrong · {v.skipped} skipped</p>
              </div>
            ))}
          </div>

          <h2 className="mt">Solutions</h2>
          {qs.map((x, i) => {
            const a = answers[x.id]
            const key = r.key[x.id] || {}
            const state = !a ? 'skipped' : a === key.c ? 'correct' : 'wrong'
            return (
              <div key={x.id} className={`card pad review review-${state}`}>
                <div className="review-head">
                  <strong>Q{i + 1}.</strong> <span className="muted small">{subjectLabel[x.subject]}{x.topic ? ` · ${x.topic}` : ''} · +{x.marks}</span>
                  <span className={`pill pill-${state}`}>{state}</span>
                </div>
                <p><Rich text={x.question_text} /></p>
                {x.image_url && <img className="q-img" src={x.image_url} alt="Question diagram" loading="lazy" />}
                <ol className="opts static">
                  {optionsOf(x).map((o, oi) => (
                    <li key={oi} className={LETTERS[oi] === key.c ? 'is-correct' : LETTERS[oi] === a ? 'is-wrong' : ''}>
                      <span className="opt-letter">{LETTERS[oi]}</span><Rich text={o} />
                    </li>
                  ))}
                </ol>
                {key.e && <div className="solution"><strong>Solution:</strong> <Rich text={key.e} /></div>}
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  // running / submitting
  const cur = qs[idx]
  const statusOf = (x) => (marked[x.id] ? 'marked' : answers[x.id] ? 'answered' : visited[x.id] ? 'visited' : 'new')
  const answeredCount = Object.keys(answers).length
  const confirmSubmit = () => window.confirm(`You have answered ${answeredCount} of ${qs.length}. Submit now?`) && submit()

  return (
    <section className="section exam">
      <div className="container exam-grid">
        <div>
          <div className="exam-bar card">
            <strong>{title}</strong>
            <span className={remaining < 60 ? 'timer low' : 'timer'}>⏱ {fmt(remaining)}</span>
          </div>
          {submitError && <ErrorBox error={submitError} />}
          <div className="card pad">
            <div className="review-head">
              <strong>Question {idx + 1} of {qs.length}</strong>
              <span className="muted small">{subjectLabel[cur.subject]} · +{cur.marks}</span>
            </div>
            <p className="q-text"><Rich text={cur.question_text} /></p>
            {cur.image_url && <img className="q-img" src={cur.image_url} alt="Question diagram" />}
            <ol className="opts">
              {optionsOf(cur).map((o, oi) => (
                <li key={oi}>
                  <button className={answers[cur.id] === LETTERS[oi] ? 'selected' : ''}
                    onClick={() => setAnswers({ ...answers, [cur.id]: LETTERS[oi] })}>
                    <span className="opt-letter">{LETTERS[oi]}</span><Rich text={o} />
                  </button>
                </li>
              ))}
            </ol>
            <div className="exam-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => { const n = { ...answers }; delete n[cur.id]; setAnswers(n) }}>Clear</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setMarked({ ...marked, [cur.id]: !marked[cur.id] })}>
                {marked[cur.id] ? 'Unmark' : 'Mark for review'}
              </button>
              <span className="spacer" />
              <button className="btn btn-ghost btn-sm" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Prev</button>
              {idx < qs.length - 1 ? (
                <button className="btn btn-primary btn-sm" onClick={() => setIdx(idx + 1)}>Save & Next →</button>
              ) : (
                <button className="btn btn-primary btn-sm" disabled={phase === 'submitting'} onClick={confirmSubmit}>Submit</button>
              )}
            </div>
          </div>
        </div>
        <aside className="card pad palette">
          <h4>Question palette</h4>
          {['physics', 'chemistry', 'maths'].filter((s) => qs.some((x) => x.subject === s)).map((s) => (
            <div key={s}>
              <div className="small muted palette-sub">{subjectLabel[s]}</div>
              <div className="palette-grid">
                {qs.map((x, i) => x.subject === s && (
                  <button key={x.id} className={`p-${statusOf(x)} ${i === idx ? 'current' : ''}`} onClick={() => setIdx(i)}>{i + 1}</button>
                ))}
              </div>
            </div>
          ))}
          <ul className="legend small">
            <li><i className="p-answered" /> Answered</li>
            <li><i className="p-marked" /> Marked</li>
            <li><i className="p-visited" /> Not answered</li>
            <li><i className="p-new" /> Not visited</li>
          </ul>
          <p className="muted small">{answeredCount}/{qs.length} answered</p>
          <button className="btn btn-accent full" disabled={phase === 'submitting'} onClick={confirmSubmit}>
            {phase === 'submitting' ? 'Submitting…' : 'Submit test'}
          </button>
        </aside>
      </div>
    </section>
  )
}
