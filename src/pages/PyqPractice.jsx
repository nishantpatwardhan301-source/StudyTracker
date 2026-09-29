import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { supabase, QUESTION_COLUMNS, optionsOf, LETTERS, paperLabel, subjectLabel } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useAsync, q as unwrap } from '../lib/useAsync'
import { loadLocalAttempts, saveLocalAttempt } from '../lib/pyqLocal'
import { Loading, ErrorBox, Empty } from '../components/Status'
import MathText from '../components/MathText'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'Unattempted' },
  { key: 'wrong', label: 'Incorrect' },
  { key: 'right', label: 'Correct' },
]

export default function PyqPractice() {
  const { chapterId } = useParams()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState('all')
  const [paperId, setPaperId] = useState('')

  // attempts: { [qid]: { p: 'A', ok: bool } }, reveals: { [qid]: { correct_option, explanation, stats } }
  const [attempts, setAttempts] = useState({})
  const [reveals, setReveals] = useState({})
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState(null) // option chosen but not yet submitted
  const [showSol, setShowSol] = useState(true)
  const [err, setErr] = useState(null)
  // Attempts as they were when the filter was chosen, so answering doesn't reshuffle the list.
  const [frozen, setFrozen] = useState({})
  const stripRef = useRef(null)

  const data = useAsync(async () => {
    const [chapters, papers, qs] = await Promise.all([
      unwrap(supabase.rpc('chapter_summary')),
      unwrap(supabase.rpc('paper_summary')),
      unwrap(supabase.from('questions').select(QUESTION_COLUMNS).eq('chapter_id', chapterId).limit(500)),
    ])
    const paperById = Object.fromEntries(papers.map((p) => [p.id, p]))
    // Newest shift first, then question number.
    qs.sort((a, b) => (paperById[b.paper_id]?.shift_date || '').localeCompare(paperById[a.paper_id]?.shift_date || '')
      || (paperById[b.paper_id]?.shift_code || '').localeCompare(paperById[a.paper_id]?.shift_code || '')
      || a.question_number - b.question_number)
    return { chapter: chapters.find((c) => c.id === chapterId), papers, paperById, qs }
  }, [chapterId])

  // Load this student's earlier attempts.
  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) {
        const local = loadLocalAttempts()
        if (alive) setAttempts(Object.fromEntries(Object.entries(local).filter(([, a]) => a.c === chapterId)))
        return
      }
      const rows = await unwrap(supabase.rpc('my_pyq_attempts', { p_chapter_id: chapterId }))
      if (alive) setAttempts(Object.fromEntries(rows.map((r) => [r.question_id, { p: r.selected_option, ok: r.is_correct }])))
    })().catch((e) => alive && setErr(e))
    return () => { alive = false }
  }, [user?.id, chapterId])

  const qs = data.data?.qs || []
  const statusOf = (qq) => (!attempts[qq.id] ? 'new' : attempts[qq.id].ok ? 'right' : 'wrong')
  const list = useMemo(() => {
    const st = (qq) => (!frozen[qq.id] ? 'new' : frozen[qq.id].ok ? 'right' : 'wrong')
    return qs.filter((qq) => (!paperId || qq.paper_id === paperId) && (filter === 'all' || st(qq) === filter))
  }, [qs, paperId, filter, frozen])

  const idx = Math.min(Math.max(Number(params.get('q') || 1) - 1, 0), Math.max(list.length - 1, 0))
  const cur = list[idx]
  const go = useCallback((i) => setParams({ q: String(i + 1) }, { replace: true }), [setParams])

  // A new question starts with nothing selected.
  useEffect(() => { setSelected(null) }, [cur?.id])

  // Fetch the answer + option stats for questions already attempted (does not count again).
  useEffect(() => {
    if (!cur || reveals[cur.id] || !attempts[cur.id]) return
    supabase.rpc('check_answer', { p_question_id: cur.id, p_selected: null }).then(({ data: r, error }) => {
      if (!error) setReveals((m) => ({ ...m, [cur.id]: r }))
    })
  }, [cur, attempts, reveals])

  // Keep the current number visible in the strip; arrow keys move between questions.
  useEffect(() => {
    stripRef.current?.querySelector('.q-pill.current')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [idx, cur?.id])
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, select, textarea')) return
      if (/^[a-dA-D1-4]$/.test(e.key) && cur && !attempts[cur.id]) setSelected(LETTERS['abcd1234'.indexOf(e.key.toLowerCase()) % 4])
      if (e.key === 'Enter' && selected && cur && !attempts[cur.id]) submit()
      if (e.key === 'ArrowRight' && idx < list.length - 1) go(idx + 1)
      if (e.key === 'ArrowLeft' && idx > 0) go(idx - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, list.length, go, cur, attempts, selected])

  async function submit() {
    const letter = selected
    if (!cur || !letter || attempts[cur.id] || busy) return
    setBusy(true); setErr(null)
    const { data: r, error } = await supabase.rpc('check_answer', { p_question_id: cur.id, p_selected: letter })
    setBusy(false)
    if (error) return setErr(error)
    setReveals((m) => ({ ...m, [cur.id]: r }))
    setAttempts((m) => ({ ...m, [cur.id]: { p: letter, ok: r.is_correct } }))
    if (!user) saveLocalAttempt(cur.id, chapterId, letter, r.is_correct)
    setShowSol(true)
  }

  if (data.loading) return <section className="section"><div className="container narrow"><Loading text="Loading questions…" /></div></section>
  if (data.error || !data.data?.chapter) {
    return (
      <section className="section"><div className="container empty">
        <h1 className="h2">Chapter not found</h1>
        {data.error && <ErrorBox error={data.error} />}
        <Link to="/pyqs" className="btn btn-primary">All chapters</Link>
      </div></section>
    )
  }

  const { chapter, papers, paperById } = data.data
  const attemptedCount = qs.filter((qq) => attempts[qq.id]).length
  const correctCount = qs.filter((qq) => attempts[qq.id]?.ok).length
  const mine = cur && attempts[cur.id]
  const rev = cur && reveals[cur.id]
  const paper = cur && paperById[cur.paper_id]

  return (
    <section className="practice">
      <div className="practice-head">
        <div className="container practice-head-inner">
          <Link to={`/pyqs?subject=${chapter.subject}`} className="back-link">← Chapters</Link>
          <div className="practice-title">
            <strong>{chapter.name}</strong>
            <span className="small muted">
              {subjectLabel[chapter.subject]} · {attemptedCount}/{qs.length} attempted
              {attemptedCount > 0 && ` · ${Math.round((correctCount / attemptedCount) * 100)}% accuracy`}
            </span>
          </div>
        </div>
        <div className="container practice-filters">
          <div className="seg">
            {FILTERS.map((f) => (
              <button key={f.key} className={filter === f.key ? 'active' : ''} onClick={() => { setFilter(f.key); setFrozen(attempts); go(0) }}>{f.label}</button>
            ))}
          </div>
          <select value={paperId} onChange={(e) => { setPaperId(e.target.value); go(0) }}>
            <option value="">All shifts</option>
            {papers.map((p) => <option key={p.id} value={p.id}>{paperLabel(p)}</option>)}
          </select>
        </div>
        {list.length > 0 && (
          <div className="container">
            <div className="q-strip" ref={stripRef}>
              {list.map((qq, i) => (
                <button key={qq.id} className={`q-pill s-${statusOf(qq)} ${i === idx ? 'current' : ''}`} onClick={() => go(i)}>{i + 1}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="container practice-body">
        {err && <ErrorBox error={err} />}
        {!cur ? (
          <Empty>No questions match this filter.</Empty>
        ) : (
          <>
            <article className="card q-card">
              <div className="q-meta">
                <span className="q-num">Q{idx + 1}<span className="muted"> / {list.length}</span></span>
                <span className="chip">MHT-CET {paperLabel(paper)}</span>
                {cur.topic && <span className="chip chip-soft">{cur.topic}</span>}
              </div>
              <div className="q-text"><MathText text={cur.question_text} /></div>
              {cur.image_url && <img className="q-img" src={cur.image_url} alt="Question diagram" loading="lazy" />}

              <div className="opts-v2">
                {optionsOf(cur).map((o, oi) => {
                  const L = LETTERS[oi]
                  const revealed = !!(mine && rev)
                  const isCorrect = revealed && rev.correct_option === L
                  const isPicked = mine?.p === L
                  const pct = revealed ? rev.stats?.[L] ?? 0 : 0
                  const isSelected = !mine && selected === L
                  const cls = ['opt2', revealed && 'revealed', isCorrect && 'correct', revealed && isPicked && !isCorrect && 'wrong', isPicked && 'picked', isSelected && 'selected']
                    .filter(Boolean).join(' ')
                  return (
                    <button key={L} className={cls} disabled={!!mine || busy} onClick={() => setSelected(L)} aria-pressed={isSelected}>
                      {revealed && <span className="opt2-bar" style={{ width: `${pct}%` }} />}
                      <span className="opt2-letter">{isCorrect ? '✓' : revealed && isPicked ? '✗' : L}</span>
                      <span className="opt2-text"><MathText text={o} /></span>
                      {revealed && <span className="opt2-pct">{pct}%</span>}
                    </button>
                  )
                })}
              </div>

              {mine && rev && (
                <div className={`verdict ${mine.ok ? 'ok' : 'bad'}`}>
                  <strong>{mine.ok ? 'Correct!' : `Incorrect. The answer is ${rev.correct_option}.`}</strong>
                  <span>
                    {rev.stats?.total > 0
                      ? `${rev.stats[rev.correct_option]}% of ${rev.stats.total} student${rev.stats.total === 1 ? '' : 's'} got this right`
                      : 'You are the first to attempt this question'}
                  </span>
                </div>
              )}
              {mine && !rev && <div className="muted small"><span className="spinner" /> Loading solution…</div>}

              {mine && rev && (
                <div className="sol-box">
                  <button className="sol-toggle" onClick={() => setShowSol(!showSol)}>
                    {showSol ? '▾' : '▸'} Solution
                  </button>
                  {showSol && <div className="sol-body"><MathText text={rev.explanation || 'Solution coming soon.'} /></div>}
                </div>
              )}
              {!mine && (
                <p className="small muted tap-hint">{selected ? `Option ${selected} selected. Press Submit to check.` : 'Select an option, then press Submit.'}</p>
              )}
            </article>

            <div className="practice-nav">
              <div className="container practice-nav-inner">
                <button className="btn btn-ghost" disabled={idx === 0} onClick={() => go(idx - 1)}>← <span className="hide-sm">Previous</span></button>
                {!mine ? (
                  <button className="btn btn-primary submit-btn" disabled={!selected || busy} onClick={submit}>
                    {busy ? 'Checking…' : 'Submit'}
                  </button>
                ) : (
                  <span className="small muted">{idx + 1} of {list.length}</span>
                )}
                <button className={mine ? 'btn btn-primary' : 'btn btn-ghost'} disabled={idx >= list.length - 1} onClick={() => go(idx + 1)}>
                  {mine ? 'Next' : 'Skip'} →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
