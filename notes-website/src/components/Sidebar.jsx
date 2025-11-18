import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from './ThemeToggle.jsx'

export default function Sidebar({ 
  isOpen, 
  onClose, 
  activeFilter, 
  onFilterChange, 
  categories,
  selectedCategory,
  onCategorySelect
}) {
  const menuItems = [
    { id: 'all', label: 'All Notes', icon: '📝' },
    { id: 'pinned', label: 'Pinned', icon: '📌' },
    { id: 'favorites', label: 'Favorites', icon: '⭐' },
    { id: 'trash', label: 'Trash', icon: '🗑️' },
  ]

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`sidebar ${isOpen ? 'open' : ''}`}
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="sidebar-header">
          <h2>Menu</h2>
          <motion.button
            className="close-sidebar"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </motion.button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.id}
              className={`sidebar-item ${activeFilter === item.id ? 'active' : ''}`}
              onClick={() => {
                onFilterChange(item.id)
                onCategorySelect(null)
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </motion.button>
          ))}
        </nav>

        {categories.length > 0 && (
          <div className="sidebar-categories">
            <h3>Categories</h3>
            <div className="category-chips">
              {categories.map((category, index) => (
                <motion.button
                  key={category}
                  className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => {
                    onCategorySelect(selectedCategory === category ? null : category)
                    if (activeFilter !== 'all') onFilterChange('all')
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div className="sidebar-footer">
          <ThemeToggle />
        </div>
      </motion.aside>
    </>
  )
}

