import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function getUsers() {
  try { return JSON.parse(localStorage.getItem('users') || '[]') } catch { return [] }
}

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleRegister = (e) => {
    e.preventDefault()
    setError('')
    const users = getUsers()
    if (users.some(u => u.email === email)) {
      setError('Email already registered')
      return
    }
    const next = [...users, { email, password }]
    localStorage.setItem('users', JSON.stringify(next))
    localStorage.setItem('session', JSON.stringify({ email }))
    navigate('/notes')
  }

  return (
    <section className="page auth">
      <h2>Register</h2>
      <form onSubmit={handleRegister} className="auth-form">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div className="error">{error}</div>}
        <button type="submit" className="primary">Create Account</button>
      </form>
      <p className="muted">Already have an account? <Link to="/login">Login</Link></p>
    </section>
  )
}


