import { useState } from 'react'
import { syllabus, subjects } from '../data/syllabus'
import { useStoredState } from '../lib/storage'

const steps = [
  { key: 'lecture', label: 'Lecture' },
  { key: 'notes', label: 'Notes' },
  { key: 'pyq', label: 'PYQs' },
  { key: 'rev1', label: 'Revision 1' },
  { key: 'rev2', label: 'Revision 2' },
]
const confidence = ['—', 'Weak', 'Okay', 'Strong']

const chaptersOf = (s) => [...syllabus[s]['12th'], ...syllabus[s]['11th']]

export default function Tracker() {
  const [data, setData] = useStoredState('np.tracker', {}) // "Subject|Chapter" -> { lecture, notes, ..., conf }
  const [examDate, setExamDate] = useStoredState('np.examDate', '')
  const [subject, setSubject] = useState('Physics')
  const [std, setStd] = useState('12th')

  const key = (s, c) => `${s}|${c}`
  const pct = (s) => {
    const chs = chaptersOf(s)
    const done = chs.reduce((n, c) => n + steps.filter((st) => data[key(s, c)]?.[st.key]).length, 0)
    return Math.round((done / (chs.length * steps.length)) * 100)
  }
  const overall = Math.round(subjects.reduce((n, s) => n + pct(s), 0) / subjects.length)
  const toggle = (c, k) =>
    setData((d) => ({ ...d, [key(subject, c)]: { ...d[key(subject, c)], [k]: !d[key(subject, c)]?.[k] } }))
  const setConf = (c, v) => setData((d) => ({ ...d, [key(subject, c)]: { ...d[key(subject, c)], conf: v } }))

  const daysLeft = examDate ? Math.ceil((new Date(examDate) - new Date()) / 86400000) : null
  const weak = subjects.flatMap((s) => chaptersOf(s).filter((c) => data[key(s, c)]?.conf === 1).map((c) => `${c} (${s})`))

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow light">Study Tracker</span>
          <h1>Track your MHT-CET preparation</h1>
          <p className="lead">Tick off lectures, notes, PYQs and revisions for every chapter. Progress is saved on this device.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-4 tracker-top">
            <div className="card pad center">
              <div className="ring" style={{ '--p': overall }}><span>{overall}%</span></div>
              <strong>Overall</strong>
            </div>
            {subjects.map((s) => (
              <button key={s} className={`card pad center subject-tile ${s === subject ? 'active' : ''}`} onClick={() => setSubject(s)}>
                <div className={`ring ring-${s.toLowerCase()}`} style={{ '--p': pct(s) }}><span>{pct(s)}%</span></div>
                <strong>{s}</strong>
              </button>
            ))}
          </div>

          <div className="grid grid-2 mt">
            <div className="card pad">
              <h3>Exam countdown</h3>
              <label className="small muted">Your MHT-CET exam date{' '}
                <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              </label>
              {daysLeft !== null && <p className="countdown"><strong>{daysLeft}</strong> days left</p>}
            </div>
            <div className="card pad">
              <h3>Weak chapters</h3>
              {weak.length ? (
                <ul className="weak">{weak.map((w) => <li key={w}>{w}</li>)}</ul>
              ) : (
                <p className="muted small">Mark a chapter’s confidence as “Weak” and it will show up here for extra revision.</p>
              )}
            </div>
          </div>

          <div className="tabs mt">
            {subjects.map((s) => (
              <button key={s} className={s === subject ? 'tab active' : 'tab'} onClick={() => setSubject(s)}>{s}</button>
            ))}
            <span className="spacer" />
            {['12th', '11th'].map((x) => (
              <button key={x} className={x === std ? 'tab active' : 'tab'} onClick={() => setStd(x)}>Class {x}</button>
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
                {syllabus[subject][std].map((c) => {
                  const row = data[key(subject, c)] || {}
                  const done = steps.filter((s) => row[s.key]).length
                  return (
                    <tr key={c} className={done === steps.length ? 'row-done' : ''}>
                      <td>
                        <span className="ch-name">{c}</span>
                        <div className="bar thin"><div style={{ width: `${(done / steps.length) * 100}%` }} /></div>
                      </td>
                      {steps.map((s) => (
                        <td key={s.key} className="center">
                          <input type="checkbox" aria-label={`${c} ${s.label}`} checked={!!row[s.key]} onChange={() => toggle(c, s.key)} />
                        </td>
                      ))}
                      <td>
                        <select value={row.conf || 0} onChange={(e) => setConf(c, Number(e.target.value))}>
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
        </div>
      </section>
    </>
  )
}
