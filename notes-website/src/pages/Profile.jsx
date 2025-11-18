import { motion } from 'framer-motion'

function getSession() {
  try { return JSON.parse(localStorage.getItem('session')) } catch { return null }
}

export default function Profile() {
  const session = getSession()
  const email = session?.email

  return (
    <motion.section 
      className="page profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Profile
      </motion.h2>
      {email ? (
        <motion.div 
          className="panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <strong>Email:</strong> {email}
          </motion.p>
          <motion.p 
            className="muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Your notes are stored locally in this browser.
          </motion.p>
        </motion.div>
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Please log in to view your profile.
        </motion.p>
      )}
    </motion.section>
  )
}


