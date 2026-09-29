export function Loading({ text = 'Loading…' }) {
  return <div className="card pad empty muted"><span className="spinner" /> {text}</div>
}

export function ErrorBox({ error }) {
  return <div className="notice error">Something went wrong: {error?.message || String(error)}</div>
}

export function Empty({ children }) {
  return <div className="card pad empty muted">{children}</div>
}

// Renders question/option text keeping line breaks.
export function Rich({ text, className = '' }) {
  return <span className={`rich ${className}`}>{text?.trim()}</span>
}
