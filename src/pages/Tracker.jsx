import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, SUBJECTS, subjectLabel } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useAsync, q as unwrap } from '../lib/useAsync'
import { useStoredState } from '../lib/storage'
import { Loading, ErrorBox } from '../components/Status'

const steps = [
  { key: 'lecture', label: 'Lecture' },
  { key: 'notes', label: 'Notes' },
  { key: 'pyq', label: 'PYQs' },
  { key: 'rev1', label: 'Revision 1' },
  { key: 'rev2', label: 'Revision 2' },
]
const confidence = ['—', 'Weak', 'Okay', 'Strong']
const pick = (row) => Object.fromEntries([...steps.map((s) => [s.key, !!row[s.key]]), ['confidence', row.confidence || 0]])

export default function Tracker() {
  const { user } = useAuth()
  const [subject, setSubject] = useState('physics')
  const [std, setStd] = useState(12)
  const [local, setLocal] = useStoredState('np.tracker', {}) // chapter_id -> row
  const [localExam, setLocalExam] = useStoredState('np.examDate', '')
  const [remote, setRemote] = useState({})
  const [examDate, setExamDate] = useState('')
  const [saveError, setSaveError] = useState(null)

  const chapters = useAsync(() => unwrap(supabase.rpc('chapter_summary')), [])

  // Load the signed-in student's progress; carry over anything they ticked before logging in.
  useEffect(() => {
    if (!user) return
    let alive = true
    ;(async () => {
      const [rows, profile] = await Promise.all([
        unwrap(supabase.from('tracker_progress').select('*')),
        unwrap(supabase.from('profiles').select('exam_date').eq('id', user.id).maybeSingle()),
      ])
      let map = Object.fromEntries(rows.map((r) => [r.chapter_id, pick(r)]))
      const carry = Object.entries(local).filter(([id]) => !map[id])
      if (carry.length) {
        await unwrap(supabase.from('tracker_progress').upsert(carry.map(([id, r]) => ({ user_id: user.id, chapter_id: id, ...pick(r) }))))
        map = { ...map, ...Object.fromEntries(carry.map(([id, r]) => [id, pick(r)])) }
        setLocal({})
      }
      if (!profile?.exam_date && localExam) {
        await supabase.from('profiles').update({ exam_date: localExam }).eq('id', user.id)
      }
      if (alive) { setRemote(map); setExamDate(profile?.exam_date || localExam || '') }
    })().catch((e) => alive && setSaveError(e))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const data = user ? remote : local
  const exam = user ? examDate : localExam
  const all = chapters.data || []
  const ofSubject = (s) => all.filter((c) => c.subject === s)

  const pct = (list) => {
    if (!list.length) return 0
    const done = list.reduce((n, c) => n + steps.filter((st) => data[c.id]?.[st.key]).length, 0)
    return Math.round((done / (list.length * steps.length)) * 100)
  }
  const overall = pct(all)

  async function update(c, patch) {
    const row = { ...pick(data[c.id] || {}), ...patch }
    if (!user) return setLocal((d) => ({ ...d, [c.id]: row }))
    setRemote((d) => ({ ...d, [c.id]: row }))
    const { error } = await supabase.from('tracker_progress')
      .upsert({ user_id: user.id, chapter_id: c.id, ...row, updated_at: new Date().toISOString() })
    setSaveError(error)
  }
  async function updateExam(v) {
    if (!user) return setLocalExam(v)
    setExamDate(v)
    const { error } = await supabase.from('profiles').update({ exam_date: v || null }).eq('id', user.id)
    setSaveError(error)
  }

  const daysLeft = exam ? Math.ceil((new Date(exam) - new Date()) / 86400000) : null
  const weak = all.filter((c) => data[c.id]?.confidence === 1)

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow light">Study Tracker</span>
          <h1>Track your MHT-CET preparation</h1>
          <p className="lead">Tick off lectures, notes, PYQs and revisions for every chapter, and see exactly where you stand.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {!user && (
            <div className="notice">
              Progress is saved on this device. <Link to="/login" state={{ from: '/tracker' }}>Log in or create a free account</Link> to save it to your account and use it on any device.
            </div>
          )}
          {saveError && <ErrorBox error={saveError} />}
          {chapters.error && <ErrorBox error={chapters.error} />}
          {chapters.loading ? <Loading text="Loading syllabus…" /> : (
            <>
              <div className="grid grid-4 tracker-top">
                <div className="card pad center">
                  <div className="ring" style={{ '--p': overall }}><span>{overall}%</span></div>
                  <strong>Overall</strong>
                </div>
                {SUBJECTS.map((s) => (
                  <button key={s.key} className={`card pad center subject-tile ${s.key === subject ? 'active' : ''}`} onClick={() => setSubject(s.key)}>
                    <div className={`ring ring-${s.key === 'maths' ? 'mathematics' : s.key}`} style={{ '--p': pct(ofSubject(s.key)) }}>
                      <span>{pct(ofSubject(s.key))}%</span>
                    </div>
                    <strong>{s.label}</strong>
                  </button>
                ))}
              </div>

              <div className="grid grid-2 mt">
                <div className="card pad">
                  <h3>Exam countdown</h3>
                  <label className="small muted">Your MHT-CET exam date{' '}
                    <input type="date" value={exam || ''} onChange={(e) => updateExam(e.target.value)} />
                  </label>
                  {daysLeft !== null && <p className="countdown"><strong>{daysLeft}</strong> days left</p>}
                </div>
                <div className="card pad">
                  <h3>Weak chapters</h3>
                  {weak.length ? (
                    <ul className="weak">
                      {weak.map((c) => (
                        <li key={c.id}>
                          {c.name} ({subjectLabel[c.subject]}){' '}
                          {c.question_count > 0 && <Link to={`/pyqs?subject=${c.subject}&chapter=${c.id}`}>Practise PYQs →</Link>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted small">Mark a chapter’s confidence as “Weak” and it will show up here for extra revision.</p>
                  )}
                </div>
              </div>

              <div className="tabs mt">
                {SUBJECTS.map((s) => (
                  <button key={s.key} className={s.key === subject ? 'tab active' : 'tab'} onClick={() => setSubject(s.key)}>{s.label}</button>
                ))}
                <span className="spacer" />
                {[12, 11].map((x) => (
                  <button key={x} className={x === std ? 'tab active' : 'tab'} onClick={() => setStd(x)}>Class {x}th</button>
                ))}
              </div>

              <div className="card table-wrap">
                <table className="tracker">
                  <thead>
                    <tr>
                      <th>Chapter</th>
                      {steps.map((s) => <th key={s.key}>{s.label}</th>)}
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ofSubject(subject).filter((c) => c.standard === std).map((c) => {
                      const row = data[c.id] || {}
                      const done = steps.filter((s) => row[s.key]).length
                      return (
                        <tr key={c.id} className={done === steps.length ? 'row-done' : ''}>
                          <td>
                            <span className="ch-name">{c.name}</span>
                            {c.question_count > 0 && (
                              <Link className="small ch-pyq" to={`/pyqs?subject=${c.subject}&chapter=${c.id}`}>{c.question_count} PYQs</Link>
                            )}
                            <div className="bar thin"><div style={{ width: `${(done / steps.length) * 100}%` }} /></div>
                          </td>
                          {steps.map((s) => (
                            <td key={s.key} className="center">
                              <input type="checkbox" aria-label={`${c.name} ${s.label}`} checked={!!row[s.key]}
                                onChange={() => update(c, { [s.key]: !row[s.key] })} />
                            </td>
                          ))}
                          <td>
                            <select value={row.confidence || 0} onChange={(e) => update(c, { confidence: Number(e.target.value) })}>
                              {confidence.map((l, i) => <option key={l} value={i}>{l}</option>)}
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="muted small mt">
                Tip: finish the lecture, make notes, solve PYQs, then revise twice with spaced gaps (about 3 days, then 2 weeks).
              </p>
            </>
          )}
        </div>
      </section>
    </>
  )
}
