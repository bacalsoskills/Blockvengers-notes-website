import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import NoteForm from '../components/NoteForm.jsx'
import NoteCard from '../components/NoteCard.jsx'
import Sidebar from '../components/Sidebar.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import ViewNoteModal from '../components/ViewNoteModal.jsx'

function getSession() {
  try { return JSON.parse(localStorage.getItem('session')) } catch { return null }
}

export default function NotesDashboard() {
  const navigate = useNavigate()
  const session = getSession()
  const userEmail = session?.email

  const [notes, setNotes] = useState([])
  const [trash, setTrash] = useState([])

  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all') // all, favorites, pinned, trash
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewingNote, setViewingNote] = useState(null)

  // Redirect if no user
  useEffect(() => {
    if (!userEmail) navigate('/login')
  }, [userEmail, navigate])

  // ================================
  // LOAD NOTES FROM BACKEND
  // ================================
  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch('http://localhost:5000/api/notes')
        const data = await res.json()

        // Attach front-end only fields (pinned, favorite, etc.)
        const enriched = data.map(n => ({
          id: n.id,
          title: n.title,
          content: n.content,
          color: n.color,
          updatedAt: n.updatedAt || Date.now(),
          pinned: false,
          favorite: false,
          category: 'Personal',
          tags: []
        }))

        setNotes(enriched)
      } catch (err) {
        console.error('Error loading notes:', err)
      }
    }

    fetchNotes()
  }, [])

  // ===================================
  // CREATE NOTE (POST)
  // ===================================
  const onCreate = async (data) => {
    try {
      const res = await fetch('http://localhost:5000/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          color: data.color
        })
      })

      const saved = await res.json()

      const newNote = {
        id: saved.id,
        title: saved.title,
        content: saved.content,
        color: saved.color,
        createdAt: Date.now(),
        updatedAt: Date.now(),

        // front-end only fields
        pinned: false,
        favorite: false,
        category: data.category || 'Personal',
        tags: data.tags || []
      }

      setNotes(prev => [newNote, ...prev])
      setShowForm(false)
    } catch (err) {
      console.error('Create failed:', err)
    }
  }

  // ===================================
  // UPDATE NOTE (PUT)
  // ===================================
  const onEditSave = async (data) => {
    if (!editing) return

    try {
      await fetch(`http://localhost:5000/api/notes/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          color: data.color
        })
      })

      setNotes(prev =>
        prev.map(n =>
          n.id === editing.id
            ? {
                ...n,
                title: data.title,
                content: data.content,
                color: data.color,
                updatedAt: Date.now(),
                category: data.category || n.category || 'Personal',
                tags: data.tags || n.tags
              }
            : n
        )
      )
    } catch (err) {
      console.error('Update failed:', err)
    }

    setEditing(null)
    setShowForm(false)
  }

  // ===================================
  // DELETE NOTE (DELETE → move to trash)
  // ===================================
  const onDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notes/${id}`, {
        method: 'DELETE'
      })
    } catch (err) {
      console.error('Backend delete failed (but will still move to trash):', err)
    }

    const note = notes.find(n => n.id === id)
    if (note) {
      setTrash(prev => [...prev, { ...note, deletedAt: Date.now() }])
      setNotes(prev => prev.filter(n => n.id !== id))
    }
  }

  // Toggle pinned (LOCAL ONLY)
  const onTogglePin = (id) => {
    setNotes(prev =>
      prev.map(n =>
        n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n
      )
    )
  }

  // Toggle favorite (LOCAL ONLY)
  const onToggleFavorite = (id) => {
    setNotes(prev =>
      prev.map(n =>
        n.id === id ? { ...n, favorite: !n.favorite, updatedAt: Date.now() } : n
      )
    )
  }

  // Restore (LOCAL ONLY)
  const onRestore = (id) => {
    const note = trash.find(n => n.id === id)
    if (note) {
      const { deletedAt, ...restored } = note
      setNotes(prev => [restored, ...prev])
      setTrash(prev => prev.filter(n => n.id !== id))
    }
  }

  // Permanent delete (LOCAL ONLY)
  const onPermanentDelete = (id) => {
    setTrash(prev => prev.filter(n => n.id !== id))
  }

  // Extract categories
  const categories = useMemo(() => {
    const cats = new Set()
    notes.forEach(n => {
      if (n.category) cats.add(n.category)
    })
    return Array.from(cats)
  }, [notes])

  // Filtering + searching
  const filteredNotes = useMemo(() => {
    let filtered = activeFilter === 'trash' ? trash : notes

    if (activeFilter === 'favorites') filtered = filtered.filter(n => n.favorite)
    if (activeFilter === 'pinned') filtered = filtered.filter(n => n.pinned)

    if (selectedCategory) {
      filtered = filtered.filter(n => n.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q) ||
        (n.tags || []).some(t => t.toLowerCase().includes(q))
      )
    }

    if (activeFilter !== 'trash') {
      filtered = filtered.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return (b.updatedAt || 0) - (a.updatedAt || 0)
      })
    } else {
      filtered = filtered.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0))
    }

    return filtered
  }, [notes, trash, activeFilter, selectedCategory, searchQuery])

  const handleNewNote = () => {
    setEditing(null)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditing(null)
  }

  // ================================
  // RETURN UI (unchanged)
  // ================================
  return (
    <div className="notes-dashboard">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      <motion.div
        className="notes-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >

        {/* Header */}
        <header className="notes-header">
          <div className="header-left">
            <motion.button
              className="menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </motion.button>

            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              QuickNotes
            </motion.h1>
          </div>

          <div className="header-right">
            <ThemeToggle />

            <motion.button
              className="add-btn"
              onClick={handleNewNote}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </motion.button>
          </div>
        </header>

        {/* Search Bar */}
        <motion.div className="search-container">
          <div className="search-box">
            <svg className="search-icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>

            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />

            {searchQuery && (
              <motion.button
                className="clear-search"
                onClick={() => setSearchQuery('')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Form Panel */}
        <AnimatePresence mode="wait">
          {(showForm || editing) && (
            <motion.div
              key={editing ? 'edit' : 'create'}
              className="form-panel"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
            >
              <h3>{editing ? 'Edit note' : 'Create a note'}</h3>
              <NoteForm
                initial={editing}
                onSave={editing ? onEditSave : onCreate}
                onCancel={handleCancelForm}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <motion.div className="empty-state">
            {searchQuery ? (
              <>
                <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <p>No notes found for "{searchQuery}"</p>
              </>
            ) : activeFilter === 'trash' ? (
              <>
                <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <p>Trash is empty</p>
              </>
            ) : (
              <>
                <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <p>No notes yet. Create your first note!</p>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div className="notes-grid">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={(n) => {
                    setEditing(n)
                    setShowForm(true)
                  }}
                  onView={(n) => setViewingNote(n)}
                  onDelete={activeFilter === 'trash' ? onPermanentDelete : onDelete}
                  onTogglePin={onTogglePin}
                  onToggleFavorite={onToggleFavorite}
                  onRestore={activeFilter === 'trash' ? onRestore : null}
                  isTrash={activeFilter === 'trash'}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* View Note Modal */}
        <ViewNoteModal
          note={viewingNote}
          isOpen={!!viewingNote}
          onClose={() => setViewingNote(null)}
          onEdit={(n) => {
            setViewingNote(null)
            setEditing(n)
            setShowForm(true)
          }}
          onDelete={activeFilter === 'trash' ? onPermanentDelete : onDelete}
          onTogglePin={onTogglePin}
          onToggleFavorite={onToggleFavorite}
        />
      </motion.div>
    </div>
  )
}
