import { Component } from 'react'

// Shows a readable message instead of a blank page if a page crashes.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <section className="section">
        <div className="container narrow">
          <div className="card pad">
            <h1 className="h2">Something went wrong on this page</h1>
            <p className="muted">Please reload. If it keeps happening, send us this message:</p>
            <pre className="error-detail">{String(this.state.error?.message || this.state.error)}</pre>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload page</button>
              <a className="btn btn-ghost" href="#/" onClick={() => this.setState({ error: null })}>Go to home</a>
            </div>
          </div>
        </div>
      </section>
    )
  }
}
