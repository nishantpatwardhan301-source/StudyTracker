import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const RESEND_SECONDS = 60

function WhatsAppLogin({ onDone }) {
  const [step, setStep] = useState('phone') // phone | code
  const [mobile, setMobile] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [wait, setWait] = useState(0)

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  const phone = `+91${mobile}`

  async function sendCode(e) {
    e?.preventDefault()
    if (!/^[6-9]\d{9}$/.test(mobile)) return setMsg({ type: 'error', text: 'Enter a valid 10-digit Indian mobile number.' })
    setBusy(true); setMsg(null)
    const { error } = await supabase.auth.signInWithOtp({ phone })
    setBusy(false)
    if (error) return setMsg({ type: 'error', text: error.message })
    setStep('code'); setCode(''); setWait(RESEND_SECONDS)
    setMsg({ type: 'ok', text: `We sent a 6-digit code to WhatsApp on +91 ${mobile}.` })
  }

  async function verify(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
    if (error) { setBusy(false); return setMsg({ type: 'error', text: error.message }) }
    if (name.trim() && !data.user?.user_metadata?.full_name) {
      await supabase.auth.updateUser({ data: { full_name: name.trim() } })
      await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', data.user.id)
    }
    setBusy(false)
    onDone()
  }

  return step === 'phone' ? (
    <form onSubmit={sendCode} className="auth-form">
      <label>WhatsApp number
        <div className="phone-input">
          <span>+91</span>
          <input required inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="98765 43210"
            value={mobile} onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setMsg(null) }} />
        </div>
      </label>
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      <button className="btn btn-whatsapp full" disabled={busy}>{busy ? 'Sending…' : 'Send code on WhatsApp'}</button>
    </form>
  ) : (
    <form onSubmit={verify} className="auth-form">
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      <label>6-digit code
        <input required autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="otp-input"
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
      </label>
      <label>Your name <span className="muted small">(new students)</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <button className="btn btn-primary full" disabled={busy || code.length !== 6}>{busy ? 'Checking…' : 'Verify & log in'}</button>
      <p className="small muted center">
        {wait > 0 ? `Resend code in ${wait}s` : <button type="button" className="link" onClick={sendCode}>Resend code</button>}
        {' · '}
        <button type="button" className="link" onClick={() => { setStep('phone'); setMsg(null) }}>Change number</button>
      </p>
    </form>
  )
}

export default function Login() {
  const { user } = useAuth()
  const nav = useNavigate()
  const from = useLocation().state?.from || '/profile'

  if (user) return <Navigate to={from} replace />
  const done = () => nav(from, { replace: true })

  return (
    <section className="section">
      <div className="container narrow">
        <div className="card pad auth-card">
          <span className="eyebrow">Free account</span>
          <h1 className="h2">Log in</h1>
          <p className="muted">Log in with your WhatsApp number to save your Study Tracker, PYQ progress and test history, and access them from any device.</p>
          <WhatsAppLogin onDone={done} />
        </div>
      </div>
    </section>
  )
}
