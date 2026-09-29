import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase, SUBJECTS, QUESTION_COLUMNS, optionsOf, LETTERS, paperLabel } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useAsync, q as unwrap } from '../lib/useAsync'
import { useStoredState } from '../lib/storage'
import { Loading, ErrorBox, Empty, Rich } from '../components/Status'

function QuestionCard({ q, n, paper, solved, onChecked }) {
  const [picked, setPicked] = useState(null)
  const [result, setResult] = useState(null) // { correct_option, explanation, is_correct }
  const [showSol, setShowSol] = useState(false)
  const [busy, setBusy] = useState(false)

  async function reveal(selected) {
    setBusy(true)
    const { data, error } = await supabase.rpc('check_answer', { p_question_id: q.id, p_selected: selected })
    setBusy(false)
    if (error) return alert(error.message)
    setResult(data)
    setShowSol(true)
    if (selected) onChecked(q.id, data.is_correct)
  }

  const correctIdx = result ? LETTERS.indexOf(result.correct_option) : -1
  return (
    <div className="card pad pyq">
      <div className="review-head">
        <strong>Q{n}.</strong>
        <span className="muted small">MHT-CET {paperLabel(paper)} · Q{q.question_number}{q.topic ? ` · ${q.topic}` : ''}</span>
        {solved !== undefined && <span className={`pill pill-${solved ? 'correct' : 'wrong'}`}>{solved ? 'solved' : 'retry'}</span>}
      </div>
      <p className="q-text"><Rich text={q.question_text} /></p>
      {q.image_url && <img className="q-img" src={q.image_url} alt="Question diagram" loading="lazy" />}
      <ol className="opts">
        {optionsOf(q).map((o, oi) => {
          let cls = ''
          if (result && oi === correctIdx) cls = 'is-correct'
          else if (result && oi === picked) cls = 'is-wrong'
          return (
            <li key={oi}>
              <button className={cls} disabled={!!result || busy} onClick={() => { setPicked(oi); reveal(LETTERS[oi]) }}>
                <span className="opt-letter">{LETTERS[oi]}</span><Rich text={o} />
              </button>
            </li>
          )
        })}
      </ol>
      <div className="exam-actions">
        {!result ? (
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => reveal(null)}>Show answer</button>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowSol(!showSol)}>{showSol ? 'Hide solution' : 'Show solution'}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setPicked(null); setResult(null); setShowSol(false) }}>Try again</button>
          </>
        )}
      </div>
      {result && showSol && (
        <div className="solution">
          <strong>Answer: {result.correct_option}.</strong> <Rich text={result.explanation || 'Solution coming soon.'} />
        </div>
      )}
    </div>
  )
}

export default function Pyqs() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const subject = params.get('subject') || 'physics'
  const chapterId = params.get('chapter') || ''
  const [paperId, setPaperId] = useState('')
  const [search, setSearch] = useState('')
  const [localRecord, setLocalRecord] = useStoredState('np.pyq', {})

  const chapters = useAsync(() => unwrap(supabase.rpc('chapter_summary')), [])
  const papers = useAsync(() => unwrap(supabase.rpc('paper_summary')), [])
  const remote = useAsync(
    () => (user ? unwrap(supabase.from('pyq_progress').select('question_id, solved')) : Promise.resolve(null)),
    [user?.id]
  )
  const record = useMemo(() => {
    if (!user) return localRecord
    return Object.fromEntries((remote.data || []).map((r) => [r.question_id, r.solved]))
  }, [user, localRecord, remote.data])

  const subjectChapters = (chapters.data || []).filter((c) => c.subject === subject)
  const activeChapter = subjectChapters.find((c) => c.id === chapterId) || subjectChapters.find((c) => c.question_count > 0)

  const questions = useAsync(async () => {
    if (!activeChapter) return []
    return unwrap(
      supabase.from('questions').select(QUESTION_COLUMNS).eq('chapter_id', activeChapter.id)
        .order('paper_id').order('question_number').limit(500)
    )
  }, [activeChapter?.id])

  const paperById = Object.fromEntries((papers.data || []).map((p) => [p.id, p]))
  const list = (questions.data || []).filter(
    (qq) => (!paperId || qq.paper_id === paperId) && (!search || qq.question_text.toLowerCase().includes(search.toLowerCase()))
  )
  const solvedInChapter = (questions.data || []).filter((qq) => record[qq.id]).length
  const total = subjectChapters.reduce((n, c) => n + Number(c.question_count), 0)

  const onChecked = (id, ok) => {
    if (user) remote.setData([...(remote.data || []).filter((r) => r.question_id !== id), { question_id: id, solved: record[id] || ok }])
    else setLocalRecord((r) => ({ ...r, [id]: r[id] || ok }))
  }
  const go = (next) => setParams({ subject, chapter: activeChapter?.id || '', ...next })

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow light">PYQ Portal</span>
          <h1>MHT-CET PYQs: free, chapter-wise, with solutions</h1>
          <p className="lead">Real MHT-CET previous year questions, shift by shift. Attempt a question and see the answer and explanation instantly.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {!user && (
            <div className="notice">
              Your progress is saved on this device. <Link to="/login" state={{ from: '/pyqs' }}>Log in</Link> to keep it across devices.
            </div>
          )}
          <div className="tabs">
            {SUBJECTS.map((s) => (
              <button key={s.key} className={s.key === subject ? 'tab active' : 'tab'} onClick={() => { setPaperId(''); setParams({ subject: s.key }) }}>
                {s.label}
              </button>
            ))}
          </div>

          {chapters.error && <ErrorBox error={chapters.error} />}
          {chapters.loading ? <Loading text="Loading chapters…" /> : total === 0 ? (
            <Empty>PYQs are being added. Please check back soon.</Empty>
          ) : (
            <div className="pyq-layout">
              <aside className="card pad chapter-list">
                <div className="small muted">{total} questions in {subjectChapters.filter((c) => c.question_count > 0).length} chapters</div>
                {[12, 11].map((std) => (
                  <div key={std}>
                    <h4 className="std-head">Class {std}th</h4>
                    {subjectChapters.filter((c) => c.standard === std).map((c) => (
                      <button key={c.id} className={activeChapter?.id === c.id ? 'ch active' : 'ch'} disabled={!c.question_count}
                        onClick={() => { setPaperId(''); go({ chapter: c.id }) }}>
                        {c.name} <span>{c.question_count || '–'}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </aside>

              <div>
                {activeChapter && (
                  <div className="chapter-head">
                    <h2 className="h3">{activeChapter.name}</h2>
                    <div className="progress-line">
                      <span>{solvedInChapter}/{questions.data?.length || 0} solved</span>
                      <div className="bar"><div style={{ width: `${questions.data?.length ? (solvedInChapter / questions.data.length) * 100 : 0}%` }} /></div>
                    </div>
                  </div>
                )}
                <div className="filters">
                  <input type="search" placeholder="Search in this chapter…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  <select value={paperId} onChange={(e) => setPaperId(e.target.value)}>
                    <option value="">All shifts</option>
                    {(papers.data || []).map((p) => <option key={p.id} value={p.id}>{paperLabel(p)}</option>)}
                  </select>
                </div>
                {questions.error && <ErrorBox error={questions.error} />}
                {questions.loading ? <Loading text="Loading questions…" /> : list.length === 0 ? (
                  <Empty>No questions match these filters.</Empty>
                ) : (
                  list.map((qq, i) => (
                    <QuestionCard key={qq.id} q={qq} n={i + 1} paper={paperById[qq.paper_id]} solved={record[qq.id]} onChecked={onChecked} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
