import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function getUsers() {
  try { return JSON.parse(localStorage.getItem('users') || '[]') } catch { return [] }
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    const users = getUsers()
    const user = users.find(u => u.email === email)
    if (!user || user.password !== password) {
      setError('Invalid email or password')
      return
    }
    localStorage.setItem('session', JSON.stringify({ email }))
    navigate('/notes')
  }

  return (
    <section className="page auth">
      <h2>Login</h2>
      <form onSubmit={handleLogin} className="auth-form">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div className="error">{error}</div>}
        <button type="submit" className="primary">Sign In</button>
      </form>
      <p className="muted">No account? <Link to="/register">Register</Link></p>
    </section>
  )
}


