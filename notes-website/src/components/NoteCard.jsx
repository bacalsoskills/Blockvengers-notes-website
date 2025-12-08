import React from 'react';
import { motion } from 'framer-motion';

export default function NoteCard({ 
  note, 
  onEdit, 
  onDelete, 
  onTogglePin, 
  onToggleFavorite,
  onRestore,
  onView,
  isTrash = false
}) {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'No date'
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getFirstLine = (content) => {
    if (!content) return ''
    const lines = String(content).split('\n').filter(line => line.trim())
    return lines[0] || ''
  };

  const content = note.content || note.body || ''
  const firstLine = getFirstLine(content)
  const title = note.title || "Untitled"

  return (
    <motion.div
      className={`note ${note.pinned ? 'pinned' : ''}`}
      data-color={note.color}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, height: 0 }}
      whileHover={{ y: -8, rotate: 0.5 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        hover: { duration: 0.2 }
      }}
      layout
    >
      {note.pinned && (
        <div className="pin-indicator">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
          </svg>
        </div>
      )}

      <div className="note-header">
        <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {title}
        </motion.h3>
        <div className="note-actions-top">
          {!isTrash && onTogglePin && (
            <motion.button
              className={`icon-btn-small ${note.pinned ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={note.pinned ? "Unpin" : "Pin"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 17v5M5 17h14l-1-7H6l-1 7zM9 10V4a3 3 0 0 1 6 0v6" />
              </svg>
            </motion.button>
          )}
          {!isTrash && onToggleFavorite && (
            <motion.button
              className={`icon-btn-small ${note.favorite ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(note.id); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={note.favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={note.favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </motion.button>
          )}
        </div>
      </div>

      {firstLine && (
        <motion.p className="note-preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          {firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine}
        </motion.p>
      )}

      {note.category && (
        <motion.div className="note-category" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <span className="category-chip">{note.category}</span>
        </motion.div>
      )}

      {note.tags && note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.slice(0, 3).map((tag, idx) => (
            <motion.span key={idx} className="tag-chip" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + idx * 0.05 }}>
              #{tag}
            </motion.span>
          ))}
          {note.tags.length > 3 && <span className="tag-chip-more">+{note.tags.length - 3}</span>}
        </div>
      )}

      <motion.div className="note-footer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <span className="note-date">{formatDate(note.updatedAt || note.deletedAt)}</span>
        <div className="note-actions">
          {!isTrash && onView && (
            <motion.button className="icon-btn-small view-btn" onClick={(e) => { e.stopPropagation(); onView(note); }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="View">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </motion.button>
          )}
          {isTrash && onRestore && (
            <motion.button className="icon-btn-small restore-btn" onClick={(e) => { e.stopPropagation(); onRestore(note.id); }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Restore">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </motion.button>
          )}
          {!isTrash && (
            <motion.button className="icon-btn-small" onClick={(e) => { e.stopPropagation(); onEdit(note); }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </motion.button>
          )}
          <motion.button className="icon-btn-small delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} whileHover={{ scale: 1.1, backgroundColor: "rgba(239, 68, 68, 0.2)" }} whileTap={{ scale: 0.9 }} title={isTrash ? "Delete permanently" : "Delete"}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
