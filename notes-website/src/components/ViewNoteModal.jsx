import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ViewNoteModal({ note, isOpen, onClose, onEdit, onDelete, onTogglePin, onToggleFavorite }) {
  if (!note) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No date';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const content = note.content || note.body || '';
  const title = note.title || 'Untitled';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="view-note-modal"
            initial={{ 
              opacity: 0, 
              scale: 0.9,
              x: '-50%',
              y: '-50%'
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: '-50%',
              y: '-50%'
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.9,
              x: '-50%',
              y: '-50%'
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%'
            }}
          >
            <div className="modal-header">
              <div className="modal-header-left">
                {note.pinned && (
                  <div className="modal-pin-indicator">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
                    </svg>
                  </div>
                )}
                <h2>{title}</h2>
              </div>
              <div className="modal-header-actions">
                {onTogglePin && (
                  <motion.button
                    className={`modal-icon-btn ${note.pinned ? 'active' : ''}`}
                    onClick={() => onTogglePin(note.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={note.pinned ? "Unpin" : "Pin"}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 17v5M5 17h14l-1-7H6l-1 7zM9 10V4a3 3 0 0 1 6 0v6" />
                    </svg>
                  </motion.button>
                )}
                {onToggleFavorite && (
                  <motion.button
                    className={`modal-icon-btn ${note.favorite ? 'active' : ''}`}
                    onClick={() => onToggleFavorite(note.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={note.favorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={note.favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </motion.button>
                )}
                {onEdit && (
                  <motion.button
                    className="modal-icon-btn"
                    onClick={() => {
                      onEdit(note);
                      onClose();
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Edit"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </motion.button>
                )}
                <motion.button
                  className="modal-close-btn"
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  title="Close"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </motion.button>
              </div>
            </div>

            <div className="modal-content">
              {note.category && (
                <div className="modal-meta">
                  <span className="modal-category">{note.category}</span>
                </div>
              )}

              {note.tags && note.tags.length > 0 && (
                <div className="modal-tags">
                  {note.tags.map((tag, idx) => (
                    <span key={idx} className="modal-tag">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="modal-body">
                {content ? (
                  <pre className="modal-text">{content}</pre>
                ) : (
                  <p className="modal-empty">No content</p>
                )}
              </div>

              <div className="modal-footer">
                <div className="modal-date">
                  <span>Created: {formatDate(note.createdAt)}</span>
                  {note.updatedAt && note.updatedAt !== note.createdAt && (
                    <span>Updated: {formatDate(note.updatedAt)}</span>
                  )}
                </div>
                {onDelete && (
                  <motion.button
                    className="modal-delete-btn"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this note?')) {
                        onDelete(note.id);
                        onClose();
                      }
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

