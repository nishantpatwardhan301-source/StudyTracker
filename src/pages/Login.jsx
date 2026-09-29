import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { user } = useAuth()
  const nav = useNavigate()
  const from = useLocation().state?.from || '/tracker'
  const [mode, setMode] = useState('signin') // signin | signup
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  if (user) return <Navigate to={from} replace />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const { email, password, name } = form
    const res = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    setBusy(false)
    if (res.error) return setMsg({ type: 'error', text: res.error.message })
    if (mode === 'signup' && !res.data.session) {
      return setMsg({ type: 'ok', text: 'Account created. Check your email to confirm it, then log in.' })
    }
    nav(from, { replace: true })
  }

  return (
    <section className="section">
      <div className="container narrow">
        <div className="card pad auth-card">
          <span className="eyebrow">{mode === 'signin' ? 'Welcome back' : 'Free account'}</span>
          <h1 className="h2">{mode === 'signin' ? 'Log in' : 'Create your account'}</h1>
          <p className="muted">Save your Study Tracker, PYQ progress and test history, and access them from any device.</p>
          <form onSubmit={submit} className="auth-form">
            {mode === 'signup' && (
              <label>Full name<input required value={form.name} onChange={set('name')} autoComplete="name" /></label>
            )}
            <label>Email<input required type="email" value={form.email} onChange={set('email')} autoComplete="email" /></label>
            <label>Password
              <input required type="password" minLength={6} value={form.password} onChange={set('password')}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
            </label>
            {msg && <div className={msg.type === 'error' ? 'notice error' : 'notice ok'}>{msg.text}</div>}
            <button className="btn btn-primary full" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'signin' ? 'Log in' : 'Create account'}
            </button>
          </form>
          <p className="small muted center mt">
            {mode === 'signin' ? 'New here? ' : 'Already have an account? '}
            <button className="link" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMsg(null) }}>
              {mode === 'signin' ? 'Create a free account' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </section>
  )
}
