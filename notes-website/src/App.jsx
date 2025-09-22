import React, { useEffect, useRef, useState, useMemo } from 'react';
import NoteCard from './components/NoteCard';
import Grid from './components/Grid';

const API_URL = "http://localhost:5000/api/notes";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [editing, setEditing] = useState(null);

  const titleRef = useRef();
  const bodyRef = useRef();
  const colorRef = useRef();

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setNotes(data))
      .catch(err => console.error("Error fetching notes:", err));
  }, []);

  const handleSave = async () => {
    const title = titleRef.current.value.trim();
    const body = bodyRef.current.value.trim();
    const color = colorRef.current.value;

    if (!title && !body) return;

    if (editing) {
      // Update existing note
      const updatedNote = { title, content: body, color };
      await fetch(`${API_URL}/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedNote)
      });
      setNotes(prev => prev.map(n => n.id === editing.id ? { ...n, ...updatedNote, updatedAt: Date.now() } : n));
      setEditing(null);
    } else {
      // Create new note
      const newNote = { title, content: body, color };
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote)
      });
      const saved = await res.json();
      setNotes(prev => [saved, ...prev]);
    }

    titleRef.current.value = "";
    bodyRef.current.value = "";
    colorRef.current.value = "yellow";
  };

  const handleEdit = (note) => {
    setEditing(note);
    titleRef.current.value = note.title;
    bodyRef.current.value = note.content; // backend stores "content" instead of "body"
    colorRef.current.value = note.color;
    titleRef.current.focus();
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    setNotes(prev => prev.filter(n => n.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [notes]);

  return (
    <div className="container">
      <header>
        <div className="logo">
          <div className="logo-mark"></div>
          <div className="logo-title">Notes</div>
        </div>
      </header>

      <div className="input-card">
        <div className="row" style={{ marginBottom: "10px" }}>
          <input ref={titleRef} type="text" placeholder="Note title" />
          <select ref={colorRef} defaultValue="yellow">
            <option value="yellow">Yellow</option>
            <option value="pink">Pink</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
          </select>
        </div>
        <textarea ref={bodyRef} placeholder="Write your note..."></textarea>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
          <button className="save-btn" onClick={handleSave}>Save note</button>
        </div>
      </div>

      <Grid notes={sortedNotes} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}