import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import NoteForm from '../components/NoteForm.jsx'
import NoteCard from '../components/NoteCard.jsx'
import Sidebar from '../components/Sidebar.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import ViewNoteModal from '../components/ViewNoteModal.jsx'

const API = "/api/notes";

function normalizeTags(t) {
  if (!t) return [];
  if (Array.isArray(t)) return t;
  try {
    const parsed = JSON.parse(t);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toTimestamp(val) {
  if (!val) return 0;
  // If already a number
  if (typeof val === 'number') return val;
  // If it's a Date object
  if (val instanceof Date) return val.getTime();
  // Otherwise try to parse string
  const parsed = Date.parse(val);
  return isNaN(parsed) ? 0 : parsed;
}

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
  const [viewingNote, setViewingNote] = useState(null);

  const loadData = async () => {
    try {
      const resNotes = await fetch(API);
      const resTrash = await fetch(`${API}/trash`);

      const dataNotes = await resNotes.json();
      const dataTrash = await resTrash.json();

      const parsedNotes = dataNotes.map(n => ({
        ...n,
        tags: normalizeTags(n.tags),
        updatedAt: toTimestamp(n.updatedAt || n.updatedAt),
      }));

      const parsedTrash = dataTrash.map(n => ({
        ...n,
        tags: normalizeTags(n.tags),
        deletedAt: toTimestamp(n.deletedAt)
      }));

      setNotes(parsedNotes);
      setTrash(parsedTrash);
    } catch (err) {
      console.error("Load data error:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Create note (POST)
  const onCreate = async (data) => {
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.error("Create failed:", err);
        return;
      }

      const newNote = await res.json();

      // Normalize
      const normalized = {
        ...newNote,
        tags: normalizeTags(newNote.tags),
        updatedAt: toTimestamp(newNote.updatedAt),
      };

      setNotes(prev => [normalized, ...prev]);
      setShowForm(false);
    } catch (err) {
      console.error("onCreate error:", err);
    }
  };

  // Save edits (PUT)
  const onEditSave = async (data) => {
  try {
    const res = await fetch(`${API}/${data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });


      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.error("Update failed:", err);
        return;
      }

      const updated = await res.json();

      const normalized = {
        ...updated,
        tags: normalizeTags(updated.tags),
        updatedAt: toTimestamp(updated.updatedAt),
      };

      setNotes(prev => prev.map(n => n.id === data.id ? normalized : n));
      setEditing(null);
      setShowForm(false);
    } catch (err) {
      console.error("onEditSave error:", err);
    }
  };

  // Soft delete -> Move to trash
  const onDelete = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        console.error("Delete failed");
        return;
      }

      const note = notes.find(n => n.id === id);
      if (note) {
        setTrash(prev => [{ ...note, deletedAt: Date.now() }, ...prev]);
        setNotes(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error("onDelete error:", err);
    }
  };

  // Restore
  const onRestore = async (id) => {
    try {
      const res = await fetch(`${API}/${id}/restore`, { method: "PUT" });
      if (!res.ok) {
        console.error("Restore failed");
        return;
      }
      const payload = await res.json();
      const restoredNote = payload.note || payload; // router returns {note: ...}

      const normalized = {
        ...restoredNote,
        tags: normalizeTags(restoredNote.tags),
        updatedAt: toTimestamp(restoredNote.updatedAt),
      };

      setNotes(prev => [normalized, ...prev]);
      setTrash(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("onRestore error:", err);
    }
  };

  // Permanent delete
  const onPermanentDelete = async (id) => {
    try {
      const res = await fetch(`${API}/${id}/permanent`, { method: "DELETE" });
      if (!res.ok) {
        console.error("Permanent delete failed");
        return;
      }
      setTrash(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("onPermanentDelete error:", err);
    }
  };

  // Toggle pin
  const onTogglePin = async (id) => {
    try {
      const note = notes.find(n => n.id === id);
      if (!note) return;

      const payload = {
        title: note.title,
        content: note.content,
        color: note.color,
        category: note.category,
        tags: note.tags,
        pinned: !note.pinned,
        favorite: note.favorite
      };

      const res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.error("Toggle pin failed");
        return;
      }

      const updated = await res.json();
      const normalized = {
        ...updated,
        tags: normalizeTags(updated.tags),
        updatedAt: toTimestamp(updated.updatedAt)
      };
      setNotes(prev => prev.map(n => n.id === id ? normalized : n));
    } catch (err) {
      console.error("onTogglePin error:", err);
    }
  };

  // Toggle favorite
  const onToggleFavorite = async (id) => {
    try {
      const note = notes.find(n => n.id === id);
      if (!note) return;

      const payload = {
        title: note.title,
        content: note.content,
        color: note.color,
        category: note.category,
        tags: note.tags,
        pinned: note.pinned,
        favorite: !note.favorite
      };

      const res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.error("Toggle favorite failed");
        return;
      }

      const updated = await res.json();
      const normalized = {
        ...updated,
        tags: normalizeTags(updated.tags),
        updatedAt: toTimestamp(updated.updatedAt)
      };
      setNotes(prev => prev.map(n => n.id === id ? normalized : n));
    } catch (err) {
      console.error("onToggleFavorite error:", err);
    }
  };

  const categories = useMemo(() => {
    const c = new Set();
    notes.forEach(n => n.category && c.add(n.category));
    return Array.from(c);
  }, [notes]);

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
        (n.tags || []).some(t => String(t).toLowerCase().includes(q))
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

        <div className="search-container">
          <input
            className="search-input"
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

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

        <div className="notes-grid">
          {filteredNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => { setEditing(note); setShowForm(true); }}
              onDelete={activeFilter === "trash" ? onPermanentDelete : onDelete}
              onTogglePin={onTogglePin}
              onToggleFavorite={onToggleFavorite}
              onRestore={activeFilter === "trash" ? onRestore : null}
              onView={(n) => { setViewingNote(n); }}
              isTrash={activeFilter === "trash"}
            />
          ))}
        </div>

        <ViewNoteModal
          note={viewingNote}
          isOpen={!!viewingNote}
          onClose={() => setViewingNote(null)}
          onEdit={(n) => {
            setViewingNote(null);
            setEditing(n);
            setShowForm(true);
          }}
          onDelete={activeFilter === 'trash' ? onPermanentDelete : onDelete}
          onTogglePin={onTogglePin}
          onToggleFavorite={onToggleFavorite}
        />
      </motion.div>
    </div>
  );
}
