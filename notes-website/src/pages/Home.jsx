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
      transition={{ duration: 0.5 }}
    >
      {session ? (
        <>
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
          >
            Welcome back{session.email ? `, ${session.email}` : ''}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
          >
            Continue to your notes or check your profile.
          </motion.p>
          <motion.div 
            className="cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link className="btn primary" to="/notes">View Notes</Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link className="btn outline" to="/profile">Profile</Link>
            </motion.div>
          </motion.div>
        </>
      ) : (
        <>
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
          >
            Welcome to Notes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
          >
            A simple, personal, and fast notebook in your browser. Organize your thoughts with style.
          </motion.p>
          <motion.div 
            className="cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link className="btn primary" to="/login">Login</Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link className="btn outline" to="/register">Register</Link>
            </motion.div>
          </motion.div>
        </>
      )}
    </motion.section>
  )
}


