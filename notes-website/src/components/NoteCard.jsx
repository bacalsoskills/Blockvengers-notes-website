import React, { useMemo } from 'react';


export default function NoteCard({ note, onEdit, onDelete }) {
  const rotation = useMemo(() => `${(Math.random() * 2 - 1.2).toFixed(2)}deg`, []);

  return (
    <div className="note" data-color={note.color} style={{ "--r": rotation }}>
      <h3>{note.title || "Untitled"}</h3>
      <p>{note.content}</p> 
      <div className="meta">
        <span>{new Date(note.updatedAt).toLocaleString()}</span>
        <div className="buttons">
          <button className="icon-btn" onClick={() => onEdit(note)}>Edit</button>
          <button className="icon-btn" onClick={() => onDelete(note.id)}>Delete</button>
        </div>
      </div>
    </div>
  );
}