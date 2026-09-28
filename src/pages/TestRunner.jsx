import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { tests, marksFor } from '../data/tests'
import { questions } from '../data/questions'
import { load, save } from '../lib/storage'
import { maxMarks } from './Tests'

const letters = ['A', 'B', 'C', 'D']
const qById = Object.fromEntries(questions.map((q) => [q.id, q]))

function fmt(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TestRunner() {
  const { testId } = useParams()
  const test = tests.find((t) => t.id === testId)
  const qs = useMemo(() => (test ? test.questionIds.map((id) => qById[id]) : []), [test])

  const [phase, setPhase] = useState('intro') // intro | running | result
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({}) // qid -> option index
  const [marked, setMarked] = useState({}) // qid -> bool
  const [visited, setVisited] = useState({})
  const [endAt, setEndAt] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [startedAt, setStartedAt] = useState(null)
  const [result, setResult] = useState(null)

  const submit = useCallback(() => {
    let score = 0, correct = 0, attempted = 0
    const perSubject = {}
    qs.forEach((q) => {
      const ps = (perSubject[q.subject] ??= { score: 0, max: 0, correct: 0, wrong: 0, skipped: 0 })
      const m = marksFor(q.subject)
      ps.max += m
      const a = answers[q.id]
      if (a === undefined) { ps.skipped++; return }
      attempted++
      if (a === q.answer) { score += m; correct++; ps.score += m; ps.correct++ } else ps.wrong++
    })
    const r = {
      testId: test.id, title: test.title, score, max: maxMarks(test), correct, attempted,
      total: qs.length, timeSec: Math.round((Date.now() - startedAt) / 1000), perSubject, at: Date.now(),
    }
    save('msa.attempts', [...load('msa.attempts', []), r])
    setResult(r)
    setPhase('result')
    window.scrollTo(0, 0)
  }, [qs, answers, test, startedAt])

  useEffect(() => {
    if (phase !== 'running') return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [phase])

  const remaining = endAt ? Math.max(0, Math.round((endAt - now) / 1000)) : 0
  useEffect(() => {
    if (phase === 'running' && remaining === 0) submit()
  }, [phase, remaining, submit])

  useEffect(() => {
    if (phase === 'running' && qs[idx]) setVisited((v) => ({ ...v, [qs[idx].id]: true }))
  }, [phase, idx, qs])

  if (!test) {
    return (
      <section className="section"><div className="container empty">
        <h1>Test not found</h1><Link to="/tests" className="btn btn-primary">Back to tests</Link>
      </div></section>
    )
  }

  if (phase === 'intro') {
    const subjects = [...new Set(qs.map((q) => q.subject))]
    return (
      <section className="section">
        <div className="container narrow">
          <div className="card pad">
            <span className="eyebrow">Instructions</span>
            <h1 className="h2">{test.title}</h1>
            <div className="test-meta big">
              <span>⏱ {test.durationMin} minutes</span>
              <span>❓ {qs.length} questions</span>
              <span>🎯 {maxMarks(test)} marks</span>
            </div>
            <ul className="ticks">
              <li>Subjects: {subjects.join(', ')}.</li>
              <li>Physics & Chemistry: +1 per correct answer. Mathematics: +2 per correct answer.</li>
              <li>No negative marking, so attempt every question.</li>
              <li>Use the palette to jump between questions. “Mark for review” flags a question to revisit.</li>
              <li>The test auto-submits when the timer ends.</li>
            </ul>
            <button
              className="btn btn-primary"
              onClick={() => {
                const t = Date.now()
                setStartedAt(t); setEndAt(t + test.durationMin * 60 * 1000); setNow(t); setPhase('running')
              }}
            >
              I’m ready, start test
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (phase === 'result') {
    const r = result
    const pct = Math.round((r.score / r.max) * 100)
    return (
      <section className="section">
        <div className="container">
          <div className="card pad result-hero">
            <div className="ring" style={{ '--p': pct }}><span>{pct}%</span></div>
            <div>
              <span className="eyebrow">Result</span>
              <h1 className="h2">{r.score} / {r.max} marks</h1>
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
            {Object.entries(r.perSubject).map(([s, v]) => (
              <div key={s} className="card pad">
                <span className={`chip chip-${s.toLowerCase()}`}>{s}</span>
                <h3>{v.score} / {v.max}</h3>
                <div className="bar"><div style={{ width: `${(v.score / v.max) * 100}%` }} /></div>
                <p className="muted small">{v.correct} correct · {v.wrong} wrong · {v.skipped} skipped</p>
              </div>
            ))}
          </div>

          <h2 className="mt">Solutions</h2>
          {qs.map((q, i) => {
            const a = answers[q.id]
            const state = a === undefined ? 'skipped' : a === q.answer ? 'correct' : 'wrong'
            return (
              <div key={q.id} className={`card pad review review-${state}`}>
                <div className="review-head">
                  <strong>Q{i + 1}.</strong> <span className="muted small">{q.subject} · {q.chapter}</span>
                  <span className={`pill pill-${state}`}>{state}</span>
                </div>
                <p>{q.q}</p>
                <ol className="opts static">
                  {q.options.map((o, oi) => (
                    <li key={oi} className={oi === q.answer ? 'is-correct' : oi === a ? 'is-wrong' : ''}>
                      <span className="opt-letter">{letters[oi]}</span>{o}
                    </li>
                  ))}
                </ol>
                <div className="solution"><strong>Solution:</strong> {q.solution}</div>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  // running
  const q = qs[idx]
  const statusOf = (qq) =>
    marked[qq.id] ? 'marked' : answers[qq.id] !== undefined ? 'answered' : visited[qq.id] ? 'visited' : 'new'
  const answeredCount = Object.keys(answers).length

  return (
    <section className="section exam">
      <div className="container exam-grid">
        <div>
          <div className="exam-bar card">
            <strong>{test.title}</strong>
            <span className={remaining < 60 ? 'timer low' : 'timer'}>⏱ {fmt(remaining)}</span>
          </div>
          <div className="card pad">
            <div className="review-head">
              <strong>Question {idx + 1} of {qs.length}</strong>
              <span className="muted small">{q.subject} · {q.chapter} · +{marksFor(q.subject)}</span>
            </div>
            <p className="q-text">{q.q}</p>
            <ol className="opts">
              {q.options.map((o, oi) => (
                <li key={oi}>
                  <button
                    className={answers[q.id] === oi ? 'selected' : ''}
                    onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                  >
                    <span className="opt-letter">{letters[oi]}</span>{o}
                  </button>
                </li>
              ))}
            </ol>
            <div className="exam-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => { const n = { ...answers }; delete n[q.id]; setAnswers(n) }}>Clear</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setMarked({ ...marked, [q.id]: !marked[q.id] })}>
                {marked[q.id] ? 'Unmark' : 'Mark for review'}
              </button>
              <span className="spacer" />
              <button className="btn btn-ghost btn-sm" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Prev</button>
              {idx < qs.length - 1 ? (
                <button className="btn btn-primary btn-sm" onClick={() => setIdx(idx + 1)}>Save & Next →</button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => window.confirm('Submit the test?') && submit()}>Submit</button>
              )}
            </div>
          </div>
        </div>
        <aside className="card pad palette">
          <h4>Question palette</h4>
          <div className="palette-grid">
            {qs.map((qq, i) => (
              <button key={qq.id} className={`p-${statusOf(qq)} ${i === idx ? 'current' : ''}`} onClick={() => setIdx(i)}>
                {i + 1}
              </button>
            ))}
          </div>
          <ul className="legend small">
            <li><i className="p-answered" /> Answered</li>
            <li><i className="p-marked" /> Marked</li>
            <li><i className="p-visited" /> Not answered</li>
            <li><i className="p-new" /> Not visited</li>
          </ul>
          <p className="muted small">{answeredCount}/{qs.length} answered</p>
          <button
            className="btn btn-accent full"
            onClick={() => window.confirm(`You have answered ${answeredCount} of ${qs.length}. Submit now?`) && submit()}
          >
            Submit test
          </button>
        </aside>
      </div>
    </section>
  )
}
