import React from 'react';
import NoteCard from './NoteCard';

export default function Grid({ notes, onEdit, onDelete }) {
  if (!notes.length) {
    return <div className="empty">No notes yet. Add your first note above.</div>;
  }

  return (
    <div className="grid">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}