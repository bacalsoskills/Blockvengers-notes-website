import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import NoteForm from '../components/NoteForm.jsx'
import NoteCard from '../components/NoteCard.jsx'
import Sidebar from '../components/Sidebar.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

const API = "http://localhost:5000/api/notes";

export default function NotesDashboard() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [trash, setTrash] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load notes + trash from backend
  const loadData = async () => {
  const resNotes = await fetch(API);
  const resTrash = await fetch(`${API}/trash`);

  const dataNotes = await resNotes.json();
  const dataTrash = await resTrash.json();

  // Parse tags + convert timestamps to numbers
  const parsedNotes = dataNotes.map(n => ({
    ...n,
    tags: n.tags ? JSON.parse(n.tags) : [],
    updatedAt: n.updatedAt ? new Date(n.updatedAt).getTime() : 0
  }));

  const parsedTrash = dataTrash.map(n => ({
    ...n,
    tags: n.tags ? JSON.parse(n.tags) : [],
    deletedAt: n.deletedAt ? new Date(n.deletedAt).getTime() : 0
  }));

  setNotes(parsedNotes);
  setTrash(parsedTrash);
};


  useEffect(() => {
    loadData();
  }, []);

  // Create note (POST)
  const onCreate = async (data) => {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const newNote = await res.json();

    newNote.tags = newNote.tags ? JSON.parse(newNote.tags) : [];

    setNotes(prev => [newNote, ...prev]);
    setShowForm(false);
  };

  // Save edits (PUT)
  const onEditSave = async (data) => {
    const res = await fetch(`${API}/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const updated = await res.json();
    updated.tags = updated.tags ? JSON.parse(updated.tags) : [];

    setNotes(prev => prev.map(n => n.id === editing.id ? updated : n));
    setEditing(null);
    setShowForm(false);
  };

  // Soft delete -> Move to trash
  const onDelete = async (id) => {
    await fetch(`${API}/${id}`, { method: "DELETE" });

    const note = notes.find(n => n.id === id);
    if (note) {
      setTrash(prev => [{ ...note, deletedAt: Date.now() }, ...prev]);
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  // Restore
  const onRestore = async (id) => {
    await fetch(`${API}/${id}/restore`, { method: "PUT" });

    const note = trash.find(n => n.id === id);
    if (note) {
      setNotes(prev => [note, ...prev]);
      setTrash(prev => prev.filter(n => n.id !== id));
    }
  };

  // Permanent delete
  const onPermanentDelete = async (id) => {
    await fetch(`${API}/${id}/permanent`, { method: "DELETE" });

    setTrash(prev => prev.filter(n => n.id !== id));
  };

  // Toggle pin
  const onTogglePin = async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const updated = { ...note, pinned: !note.pinned };

    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    });

    setNotes(prev => prev.map(n => n.id === id ? updated : n));
  };

  // Toggle favorite
  const onToggleFavorite = async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const updated = { ...note, favorite: !note.favorite };

    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    });

    setNotes(prev => prev.map(n => n.id === id ? updated : n));
  };

  // Categories
  const categories = useMemo(() => {
    const c = new Set();
    notes.forEach(n => n.category && c.add(n.category));
    return Array.from(c);
  }, [notes]);

  // Filter + sort
  const filteredNotes = useMemo(() => {
    let list = activeFilter === "trash" ? trash : notes;

    if (activeFilter === "favorites") list = list.filter(n => n.favorite);
    else if (activeFilter === "pinned") list = list.filter(n => n.pinned);

    if (selectedCategory) list = list.filter(n => n.category === selectedCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(n =>
        (n.title || "").toLowerCase().includes(q) ||
        (n.content || "").toLowerCase().includes(q) ||
        (n.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    if (activeFilter !== "trash") {
      list.sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt - a.updatedAt));
    } else {
      list.sort((a, b) => (b.deletedAt - a.deletedAt));
    }

    return list;
  }, [notes, trash, activeFilter, selectedCategory, searchQuery]);

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

      <motion.div className="notes-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

        {/* Header */}
        <header className="notes-header">
          <div className="header-left">
            <motion.button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </motion.button>
            <h1>QuickNotes</h1>
          </div>

          <div className="header-right">
            <ThemeToggle />
            <motion.button className="add-btn" onClick={() => { setEditing(null); setShowForm(true); }}>
              +
            </motion.button>
          </div>
        </header>

        {/* Search */}
        <div className="search-container">
          <input
            className="search-input"
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Form Panel */}
        <AnimatePresence>
          {(showForm || editing) && (
            <motion.div className="form-panel">
              <h3>{editing ? "Edit note" : "Create a note"}</h3>

              <NoteForm
                initial={editing}
                onSave={editing ? onEditSave : onCreate}
                onCancel={() => { setEditing(null); setShowForm(false); }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes Grid */}
        <div className="notes-grid">
          {filteredNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}

              onEdit={() => { setEditing(note); setShowForm(true); }}

              onDelete={activeFilter === "trash"
                ? onPermanentDelete
                : onDelete}

              onTogglePin={onTogglePin}
              onToggleFavorite={onToggleFavorite}
              onRestore={activeFilter === "trash" ? onRestore : null}

              isTrash={activeFilter === "trash"}
            />
          ))}
        </div>

      </motion.div>
    </div>
  );
}
