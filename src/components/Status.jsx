import MathText from './MathText'

export function Loading({ text = 'Loading…' }) {
  return <div className="card pad empty muted"><span className="spinner" /> {text}</div>
}

export function ErrorBox({ error }) {
  return <div className="notice error">Something went wrong: {error?.message || String(error)}</div>
}

export function Empty({ children }) {
  return <div className="card pad empty muted">{children}</div>
}

// Renders question/option/solution text with maths formatting and line breaks.
export function Rich({ text, className = '' }) {
  return <MathText text={text} className={className} />
}
