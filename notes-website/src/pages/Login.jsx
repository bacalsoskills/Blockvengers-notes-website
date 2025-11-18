import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

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
    <motion.section 
      className="page auth"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Welcome Back
      </motion.h2>
      <motion.form 
        onSubmit={handleLogin} 
        className="auth-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.input
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required
          whileFocus={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        <motion.input
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required
          whileFocus={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        <AnimatePresence>
          {error && (
            <motion.div
              className="error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          type="submit" 
          className="primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          Sign In
        </motion.button>
      </motion.form>
      <motion.p
        className="muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ textAlign: 'center', marginTop: '24px' }}
      >
        No account? <Link to="/register">Register</Link>
      </motion.p>
    </motion.section>
  )
}


