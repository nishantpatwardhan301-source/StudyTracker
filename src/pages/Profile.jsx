import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase, SUBJECTS, subjectLabel, paperLabel } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useAsync, q as unwrap } from '../lib/useAsync'
import { scopes } from '../data/tests'
import { Loading, ErrorBox, Empty } from '../components/Status'

const CLASSES = ['11th', '12th', 'Dropper / Repeater']
const TRACKER_STEPS = ['lecture', 'notes', 'pyq', 'rev1', 'rev2']
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
const fmtTime = (s) => (s == null ? '—' : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`)

function ProfileForm({ user, profile, onSaved }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || user.user_metadata?.full_name || '',
    class_standard: profile?.class_standard || '',
    exam_date: profile?.exam_date || '',
  })
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const row = { full_name: form.full_name.trim() || null, class_standard: form.class_standard || null, exam_date: form.exam_date || null, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('profiles').update(row).eq('id', user.id)
    if (!error && row.full_name) await supabase.auth.updateUser({ data: { full_name: row.full_name } })
    setBusy(false)
    if (error) return setMsg({ type: 'error', text: error.message })
    setMsg({ type: 'ok', text: 'Profile saved.' })
    onSaved(row)
  }

  return (
    <form className="profile-form" onSubmit={save}>
      <label>Full name<input value={form.full_name} onChange={set('full_name')} autoComplete="name" /></label>
      <label>Class
        <select value={form.class_standard} onChange={set('class_standard')}>
          <option value="">Select</option>
          {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label>MHT-CET exam date<input type="date" value={form.exam_date} onChange={set('exam_date')} /></label>
      <div className="profile-form-actions">
        {msg && <span className={`small ${msg.type === 'ok' ? 'ok-text' : 'bad-text'}`}>{msg.text}</span>}
        <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  )
}

export default function Profile() {
  const { user, loading } = useAuth()
  const nav = useNavigate()
  const [profile, setProfile] = useState(null)

  const data = useAsync(async () => {
    if (!user) return null
    const [prof, chapters, chapterProg, attempts, tracker, papers] = await Promise.all([
      unwrap(supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()),
      unwrap(supabase.rpc('chapter_summary')),
      unwrap(supabase.rpc('my_chapter_progress')),
      unwrap(supabase.from('test_attempts')
        .select('id, paper_id, scope, score, max_score, correct, attempted, total, time_taken_seconds, per_subject, created_at')
        .order('created_at', { ascending: false }).limit(100)),
      unwrap(supabase.from('tracker_progress').select('*')),
      unwrap(supabase.rpc('paper_summary')),
    ])
    return { prof, chapters, chapterProg, attempts, tracker, papers }
  }, [user?.id])

  useEffect(() => { if (data.data) setProfile(data.data.prof) }, [data.data])

  if (loading) return <section className="section"><div className="container narrow"><Loading /></div></section>
  if (!user) return <Navigate to="/login" state={{ from: '/profile' }} replace />
  if (data.error) return <section className="section"><div className="container"><ErrorBox error={data.error} /></div></section>

  if (data.loading || !data.data) return <section className="section"><div className="container"><Loading text="Loading your profile…" /></div></section>

  const { chapters, chapterProg, attempts, tracker, papers } = data.data
  const paperById = Object.fromEntries(papers.map((p) => [p.id, p]))
  const chapterById = Object.fromEntries(chapters.map((c) => [c.id, c]))
  const progById = Object.fromEntries(chapterProg.map((r) => [r.chapter_id, { attempted: Number(r.attempted), correct: Number(r.correct) }]))

  // PYQ stats per subject
  const subj = Object.fromEntries(SUBJECTS.map((s) => [s.key, { total: 0, attempted: 0, correct: 0 }]))
  for (const c of chapters) {
    const s = subj[c.subject]
    s.total += Number(c.question_count)
    s.attempted += progById[c.id]?.attempted || 0
    s.correct += progById[c.id]?.correct || 0
  }
  const pyqAttempted = Object.values(subj).reduce((n, s) => n + s.attempted, 0)
  const pyqCorrect = Object.values(subj).reduce((n, s) => n + s.correct, 0)
  const pyqTotal = Object.values(subj).reduce((n, s) => n + s.total, 0)

  const weak = chapterProg
    .map((r) => ({ c: chapterById[r.chapter_id], a: Number(r.attempted), ok: Number(r.correct) }))
    .filter((x) => x.c && x.a >= 3 && x.ok / x.a < 0.6)
    .sort((x, y) => x.ok / x.a - y.ok / y.a)
    .slice(0, 8)

  // Tests
  const bestPct = attempts.length ? Math.max(...attempts.map((a) => pct(a.score, a.max_score))) : 0

  // Study tracker
  const trackerDone = tracker.reduce((n, r) => n + TRACKER_STEPS.filter((k) => r[k]).length, 0)
  const trackerPct = pct(trackerDone, chapters.length * TRACKER_STEPS.length)
  const trackerBySubject = Object.fromEntries(SUBJECTS.map((s) => {
    const ids = new Set(chapters.filter((c) => c.subject === s.key).map((c) => c.id))
    const done = tracker.filter((r) => ids.has(r.chapter_id)).reduce((n, r) => n + TRACKER_STEPS.filter((k) => r[k]).length, 0)
    return [s.key, pct(done, ids.size * TRACKER_STEPS.length)]
  }))

  const name = profile?.full_name || user.user_metadata?.full_name || 'Student'
  const digits = (user.phone || '').replace(/\D/g, '')
  const contact = digits.length === 12 && digits.startsWith('91')
    ? `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
    : digits ? `+${digits}` : user.email
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const daysLeft = profile?.exam_date ? Math.ceil((new Date(profile.exam_date) - new Date()) / 86400000) : null

  return (
    <>
      <section className="page-head profile-head">
        <div className="container profile-hero">
          <div className="avatar-lg">{initials}</div>
          <div>
            <span className="eyebrow light">My profile</span>
            <h1>{name}</h1>
            <p className="lead">
              {contact}
              {profile?.class_standard && ` · ${profile.class_standard}`}
              {' · '}Member since {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </p>
          </div>
          {daysLeft !== null && daysLeft >= 0 && (
            <div className="countdown-chip"><strong>{daysLeft}</strong><span>days to MHT-CET</span></div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-4 stat-cards">
            <div className="card pad stat-card"><span className="muted small">PYQs attempted</span><strong>{pyqAttempted}</strong><span className="small muted">of {pyqTotal}</span></div>
            <div className="card pad stat-card"><span className="muted small">PYQ accuracy</span><strong>{pct(pyqCorrect, pyqAttempted)}%</strong><span className="small muted">{pyqCorrect} correct</span></div>
            <div className="card pad stat-card"><span className="muted small">Tests taken</span><strong>{attempts.length}</strong><span className="small muted">best {bestPct}%</span></div>
            <div className="card pad stat-card"><span className="muted small">Syllabus tracked</span><strong>{trackerPct}%</strong><span className="small muted">Study Tracker</span></div>
          </div>

          <div className="profile-grid mt">
            <div className="card pad">
              <h3>PYQ progress by subject</h3>
              {SUBJECTS.map((s) => {
                const v = subj[s.key]
                return (
                  <div key={s.key} className="subj-row">
                    <div className="subj-row-top">
                      <strong>{s.label}</strong>
                      <span className="small muted">{v.attempted}/{v.total} · {pct(v.correct, v.attempted)}% accuracy</span>
                    </div>
                    <div className="bar"><div style={{ width: `${pct(v.attempted, v.total)}%` }} /></div>
                  </div>
                )
              })}
              <Link to="/pyqs" className="btn btn-ghost btn-sm mt">Practise PYQs →</Link>
            </div>

            <div className="card pad">
              <h3>Chapters to improve</h3>
              {weak.length === 0 ? (
                <p className="muted small">Chapters where your accuracy is below 60% (after at least 3 questions) will appear here.</p>
              ) : (
                <ul className="weak-list">
                  {weak.map((w) => (
                    <li key={w.c.id}>
                      <Link to={`/pyqs/${w.c.id}`}>
                        <span>{w.c.name} <span className="muted small">· {subjectLabel[w.c.subject]}</span></span>
                        <span className="bad-text small">{pct(w.ok, w.a)}% ({w.ok}/{w.a})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card pad">
              <h3>Study Tracker</h3>
              {SUBJECTS.map((s) => (
                <div key={s.key} className="subj-row">
                  <div className="subj-row-top"><strong>{s.label}</strong><span className="small muted">{trackerBySubject[s.key]}%</span></div>
                  <div className="bar"><div style={{ width: `${trackerBySubject[s.key]}%` }} /></div>
                </div>
              ))}
              <Link to="/tracker" className="btn btn-ghost btn-sm mt">Open Study Tracker →</Link>
            </div>

            <div className="card pad">
              <h3>My details</h3>
              <ProfileForm key={profile ? 'loaded' : 'empty'} user={user} profile={profile} onSaved={(row) => setProfile((p) => ({ ...p, ...row }))} />
            </div>
          </div>

          <h2 className="mt">Test history</h2>
          {attempts.length === 0 ? (
            <Empty>No tests yet. <Link to="/tests">Take your first MHT-CET paper →</Link></Empty>
          ) : (
            <div className="card table-wrap">
              <table>
                <thead>
                  <tr><th>Date</th><th>Paper</th><th>Section</th><th>Score</th><th>Accuracy</th><th>Physics</th><th>Chemistry</th><th>Maths</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {attempts.map((a) => (
                    <tr key={a.id}>
                      <td>{new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                      <td>{paperLabel(paperById[a.paper_id]) || '—'}</td>
                      <td>{scopes[a.scope]?.label}</td>
                      <td><strong>{a.score}</strong>/{a.max_score} <span className="muted small">({pct(a.score, a.max_score)}%)</span></td>
                      <td>{pct(a.correct, a.attempted)}%</td>
                      {['physics', 'chemistry', 'maths'].map((s) => (
                        <td key={s}>{a.per_subject?.[s] ? `${a.per_subject[s].score}/${a.per_subject[s].max}` : '—'}</td>
                      ))}
                      <td>{fmtTime(a.time_taken_seconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="center mt">
            <button className="btn btn-ghost" onClick={async () => { await supabase.auth.signOut(); nav('/') }}>Log out</button>
          </div>
        </div>
      </section>
    </>
  )
}
