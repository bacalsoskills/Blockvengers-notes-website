import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <section className="page home">
      <h1>Welcome to Notes</h1>
      <p>A simple, personal, and fast notebook in your browser.</p>
      <div className="cta">
        <Link className="btn" to="/login">Login</Link>
        <Link className="btn outline" to="/register">Register</Link>
      </div>
    </section>
  )
}


