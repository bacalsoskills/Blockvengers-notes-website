import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NoteCard from './NoteCard';

export default function Grid({ notes, onEdit, onDelete }) {
  if (!notes.length) {
    return (
      <motion.div 
        className="empty"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          No notes yet. Add your first note above.
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="popLayout">
        {notes.map((note, index) => (
          <NoteCard
            key={note.id}
            note={note}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}