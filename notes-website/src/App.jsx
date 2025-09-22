import React, { useEffect, useMemo, useRef, useState } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import NoteCard from './components/NoteCard';
import Grid from './components/Grid';

export default function App() {
  const [notes, setNotes] = useLocalStorage("notes", []);
  const [editing, setEditing] = useState(null);

  const titleRef = useRef();
  const bodyRef = useRef();
  const colorRef = useRef();

  const handleSave = () => {
    const title = titleRef.current.value.trim();
    const body = bodyRef.current.value.trim();
    const color = colorRef.current.value;

    if (!body && !title) return;

    if (editing) {
      setNotes(prev =>
        prev.map(n =>
          n.id === editing.id
            ? { ...n, title, body, color, updatedAt: Date.now() }
            : n
        )
      );
      setEditing(null);
    } else {
      const newNote = {
        id: crypto.randomUUID(),
        title,
        body,
        color,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNotes(prev => [newNote, ...prev]);
    }

    titleRef.current.value = "";
    bodyRef.current.value = "";
    colorRef.current.value = "yellow";
  };

  const handleEdit = (note) => {
    setEditing(note);
    titleRef.current.value = note.title;
    bodyRef.current.value = note.body;
    colorRef.current.value = note.color;
    titleRef.current.focus();
  };

  const handleDelete = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(notes, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(text => {
      try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          setNotes(data.map(n => ({ ...n, id: n.id || crypto.randomUUID() })));
        }
      } catch (err) {
        console.error("Failed to import:", err);
      }
    });
    e.target.value = "";
  };

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes]);

  return (
    <div className="container">
      <header>
        <div className="logo">
          <div className="logo-mark"></div>
          <div className="logo-title">Notes</div>
        </div>
        <div className="actions">
          <button className="action-btn" onClick={handleExport}>Export</button>
          <label className="action-btn">
            Import
            <input type="file" accept="application/json" hidden onChange={handleImport} />
          </label>
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
