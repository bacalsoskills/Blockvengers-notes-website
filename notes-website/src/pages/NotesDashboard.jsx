import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NoteForm from '../components/NoteForm.jsx'
import NoteCard from '../components/NoteCard.jsx'

function getSession() {
  try { return JSON.parse(localStorage.getItem('session')) } catch { return null }
}

function loadNotes(email) {
  try { return JSON.parse(localStorage.getItem(`notes:${email}`) || '[]') } catch { return [] }
}

function saveNotes(email, notes) {
  localStorage.setItem(`notes:${email}`, JSON.stringify(notes))
}

export default function NotesDashboard() {
  const navigate = useNavigate()
  const session = getSession()
  const userEmail = session?.email

  const [notes, setNotes] = useState(() => userEmail ? loadNotes(userEmail) : [])
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    if (!userEmail) navigate('/login')
  }, [userEmail, navigate])

  useEffect(() => {
    if (userEmail) saveNotes(userEmail, notes)
  }, [userEmail, notes])

  const onCreate = (data) => {
    const newNote = { id: crypto.randomUUID(), ...data, createdAt: Date.now(), updatedAt: Date.now() }
    setNotes(prev => [newNote, ...prev])
  }

  const onEditSave = (data) => {
    if (!editing) return
    setNotes(prev => prev.map(n => n.id === editing.id ? { ...n, ...data, updatedAt: Date.now() } : n))
    setEditing(null)
  }

  const onDelete = (id) => setNotes(prev => prev.filter(n => n.id !== id))

  const sorted = useMemo(() => [...notes].sort((a,b) => b.updatedAt - a.updatedAt), [notes])

  return (
    <section className="page notes">
      <h2>Your Notes</h2>
      {editing ? (
        <div className="panel">
          <h3>Edit note</h3>
          <NoteForm initial={editing} onSave={onEditSave} onCancel={() => setEditing(null)} />
        </div>
      ) : (
        <div className="panel">
          <h3>Create a note</h3>
          <NoteForm onSave={onCreate} />
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="empty">No notes yet. Create your first note above.</div>
      ) : (
        <div className="grid">
          {sorted.map(n => (
            <NoteCard key={n.id} note={n} onEdit={setEditing} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  )
}


