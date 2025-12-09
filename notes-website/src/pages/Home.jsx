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
      className="page home centered-hero"
      role="main"
      aria-label="Home"
      style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', paddingTop: 28, paddingBottom: 28, minHeight: 'auto' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="hero-content">
        <motion.h1
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 200, damping: 18 }}
        >
          {session ? `Welcome back${session.email ? `, ${session.email}` : ''}` : 'Welcome to Notes'}
        </motion.h1>

        <motion.p
          className="hero-sub"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          {session
            ? 'Your personal notes are ready — quick, private, and reliable.'
            : 'A simple, personal notebook inside your browser. Capture ideas quickly and find them later.'}
        </motion.p>

        <motion.div
          className="home-features"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.26 }}
        >
          <div className="feature input-card" aria-hidden="true">
            <div className="icon">📝</div>
            <h4>Fast capture</h4>
            <p className="muted">Save notes instantly without any delay.</p>
          </div>

          <div className="feature input-card" aria-hidden="true">
            <div className="icon">🔒</div>
            <h4>Local-first</h4>
            <p className="muted">Your notes are safely stored in the database.</p>
          </div>

          <div className="feature input-card" aria-hidden="true">
            <div className="icon">⚡</div>
            <h4>Responsive</h4>
            <p className="muted">Always works smoothly when you need it.</p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}
