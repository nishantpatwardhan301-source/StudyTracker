import { useMemo, useState } from 'react'
import { questions } from '../data/questions'
import { syllabus, subjects } from '../data/syllabus'
import { useStoredState } from '../lib/storage'
import { watchUrl } from '../data/site'

const letters = ['A', 'B', 'C', 'D']

function QuestionCard({ q, n, record, onAnswer }) {
  const [picked, setPicked] = useState(null)
  const [showSol, setShowSol] = useState(false)
  const done = picked !== null
  return (
    <div className="card pad pyq">
      <div className="review-head">
        <strong>Q{n}.</strong>
        <span className="muted small">{q.chapter}{q.year ? ` · MHT-CET ${q.year}${q.shift ? ` (${q.shift})` : ''}` : ' · Practice'}</span>
        {record !== undefined && <span className={`pill pill-${record ? 'correct' : 'wrong'}`}>{record ? 'solved' : 'retry'}</span>}
      </div>
      <p className="q-text">{q.q}</p>
      <ol className="opts">
        {q.options.map((o, oi) => {
          let cls = ''
          if (done && oi === q.answer) cls = 'is-correct'
          else if (done && oi === picked) cls = 'is-wrong'
          return (
            <li key={oi}>
              <button
                className={cls}
                disabled={done}
                onClick={() => { setPicked(oi); setShowSol(true); onAnswer(q.id, oi === q.answer) }}
              >
                <span className="opt-letter">{letters[oi]}</span>{o}
              </button>
            </li>
          )
        })}
      </ol>
      <div className="exam-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => setShowSol(!showSol)}>
          {showSol ? 'Hide solution' : 'Show solution'}
        </button>
        {done && <button className="btn btn-ghost btn-sm" onClick={() => { setPicked(null); setShowSol(false) }}>Try again</button>}
        {q.video && <a className="btn btn-ghost btn-sm" href={watchUrl(q.video)} target="_blank" rel="noreferrer">▶ Video solution</a>}
      </div>
      {showSol && (
        <div className="solution">
          <strong>Answer: {letters[q.answer]}.</strong> {q.solution}
        </div>
      )}
    </div>
  )
}

export default function Pyqs() {
  const [subject, setSubject] = useState('Physics')
  const [chapter, setChapter] = useState('All')
  const [year, setYear] = useState('All')
  const [search, setSearch] = useState('')
  const [record, setRecord] = useStoredState('msa.pyq', {})

  const chapters = useMemo(() => {
    const all = [...syllabus[subject]['12th'], ...syllabus[subject]['11th']]
    return all.map((c) => ({ name: c, count: questions.filter((q) => q.subject === subject && q.chapter === c).length }))
  }, [subject])

  const years = useMemo(
    () => [...new Set(questions.filter((q) => q.year).map((q) => q.year))].sort((a, b) => b - a),
    []
  )

  const list = questions.filter(
    (q) =>
      q.subject === subject &&
      (chapter === 'All' || q.chapter === chapter) &&
      (year === 'All' || String(q.year) === year) &&
      (!search || q.q.toLowerCase().includes(search.toLowerCase()))
  )

  const subjectQs = questions.filter((q) => q.subject === subject)
  const solved = subjectQs.filter((q) => record[q.id]).length
  const hasOfficial = questions.some((q) => q.year)

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow light">PYQ Portal</span>
          <h1>MHT-CET PYQs: free, chapter-wise, with solutions</h1>
          <p className="lead">Pick a chapter, attempt the question, and check the solution instantly. Your progress is saved on this device.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {!hasOfficial && (
            <div className="notice">
              These are practice questions in the MHT-CET style. The official year-wise PYQ bank is being added and will
              appear here with year and shift tags.
            </div>
          )}
          <div className="tabs">
            {subjects.map((s) => (
              <button key={s} className={s === subject ? 'tab active' : 'tab'} onClick={() => { setSubject(s); setChapter('All') }}>
                {s}
              </button>
            ))}
          </div>

          <div className="pyq-layout">
            <aside className="card pad chapter-list">
              <div className="progress-line">
                <span>{solved}/{subjectQs.length} solved</span>
                <div className="bar"><div style={{ width: `${subjectQs.length ? (solved / subjectQs.length) * 100 : 0}%` }} /></div>
              </div>
              <button className={chapter === 'All' ? 'ch active' : 'ch'} onClick={() => setChapter('All')}>
                All chapters <span>{subjectQs.length}</span>
              </button>
              {chapters.map((c) => (
                <button key={c.name} className={chapter === c.name ? 'ch active' : 'ch'} onClick={() => setChapter(c.name)} disabled={!c.count}>
                  {c.name} <span>{c.count || '–'}</span>
                </button>
              ))}
            </aside>

            <div>
              <div className="filters">
                <input type="search" placeholder="Search questions…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <select value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="All">All years</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {list.length === 0 ? (
                <div className="card pad empty">No questions here yet. More are being added.</div>
              ) : (
                list.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    n={i + 1}
                    record={record[q.id]}
                    onAnswer={(id, ok) => setRecord((r) => ({ ...r, [id]: r[id] || ok }))}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
