import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="section">
      <div className="container empty">
        <h1>Page not found</h1>
        <Link to="/" className="btn btn-primary">Go home</Link>
      </div>
    </section>
  )
}
