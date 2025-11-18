import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

let notificationId = 0

export function useNotifications() {
  const [notifications, setNotifications] = useState([])

  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = notificationId++
    const notification = {
      id,
      message,
      type, // 'info', 'success', 'warning', 'error'
      timestamp: Date.now()
    }

    setNotifications(prev => [...prev, notification])

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  }
}

export function NotificationContainer({ notifications, onRemove }) {
  if (notifications.length === 0) return null

  return (
    <div className="notification-container">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            className={`notification notification-${notification.type}`}
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="notification-icon">
              {notification.type === 'success' && (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              )}
              {notification.type === 'error' && (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              )}
              {notification.type === 'warning' && (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              )}
              {notification.type === 'info' && (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              )}
            </div>
            
            <div className="notification-content">
              <p>{notification.message}</p>
            </div>
            
            <button
              className="notification-close"
              onClick={() => onRemove(notification.id)}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default useNotifications