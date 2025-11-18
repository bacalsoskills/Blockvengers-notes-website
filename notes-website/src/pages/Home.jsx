import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function getSession() {
  try {
    const raw = localStorage.getItem('session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function Home() {
  const session = getSession()

  return (
    <motion.section
      className="page home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="container home-hero">
        <motion.div
          className="hero-left"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
        >
          <h1 className="logo-title">
            {session ? `Welcome back${session.email ? `, ${session.email}` : ''}` : 'Notes — your ideas, organized'}
          </h1>

          <motion.p
            className="muted"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {session
              ? 'Organize, create, and access your notes seamlessly. Notes are securely saved both on the Cardano blockchain and in our database for maximum reliability.'
              : 'A fast, simple notebook backed by Cardano and our database for secure, persistent storage. Sign up to save and sync your notes across devices.'}
          </motion.p>
        </motion.div>
      </div>

      <div className="container home-features">
        <motion.div className="feature" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="icon">📝</div>
          <h3>Organize</h3>
          <p className="muted">Tags and quick search make finding notes easy.</p>
        </motion.div>

        <motion.div className="feature" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
          <div className="icon">⚡</div>
          <h3>Fast</h3>
          <p className="muted">Minimal interface focused on speed and clarity.</p>
        </motion.div>

        <motion.div className="feature" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          <div className="icon">🔒</div>
          <h3>Persistent</h3>
          <p className="muted">Notes are stored securely on Cardano and in our database for reliability.</p>
        </motion.div>
      </div>
    </motion.section>
  )
}


