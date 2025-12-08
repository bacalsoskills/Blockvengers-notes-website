import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const CATEGORIES = ['Personal', 'Work', 'School', 'Shopping', 'Ideas', 'Travel']
const COMMON_TAGS = ['important', 'todo', 'reminder', 'meeting', 'project', 'homework']

export default function NoteForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [body, setBody] = useState(initial?.body || '')
  const [color, setColor] = useState(initial?.color || 'yellow')
  const [category, setCategory] = useState(initial?.category || 'Personal')
  const [tags, setTags] = useState(initial?.tags || [])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    setTitle(initial?.title || '')
    setBody(initial?.body || '')
    setColor(initial?.color || 'yellow')
    setCategory(initial?.category || 'Personal')
    setTags(initial?.tags || [])
  }, [initial])

  // Inside NoteForm.jsx

const submit = (e) => {
  e.preventDefault()
  if (!title.trim() && !body.trim()) return
  
  onSave({ 
    title: title.trim(), 
    content: body.trim(), // CHANGE: Rename 'body' to 'content'
    color,
    category,
    tags: tags.filter(t => t.trim())
  })
}

  const addTag = (tag) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  return (
    <motion.form 
      className="note-form" 
      onSubmit={submit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="form-row"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <input
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Note title"
          className="form-input"
        />
        <select
          value={color} 
          onChange={(e) => setColor(e.target.value)}
          className="form-select"
        >
          <option value="yellow">Yellow</option>
          <option value="pink">Pink</option>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
        </select>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="form-row"
      >
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-select"
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </motion.div>

      <motion.textarea 
        value={body} 
        onChange={(e) => setBody(e.target.value)} 
        placeholder="Write your note..."
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="form-textarea"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="tags-section"
      >
        <div className="tags-input-container">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Add tags (press Enter)"
            className="tags-input"
          />
        </div>
        {tags.length > 0 && (
          <div className="tags-display">
            {tags.map((tag, idx) => (
              <motion.span
                key={idx}
                className="tag-input-chip"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => removeTag(tag)}
              >
                #{tag}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </motion.span>
            ))}
          </div>
        )}
        {COMMON_TAGS.length > 0 && (
          <div className="common-tags">
            {COMMON_TAGS
              .filter(t => !tags.includes(t))
              .slice(0, 4)
              .map(tag => (
                <motion.button
                  key={tag}
                  type="button"
                  className="common-tag-btn"
                  onClick={() => addTag(tag)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  + {tag}
                </motion.button>
              ))}
          </div>
        )}
      </motion.div>

      <motion.div 
        className="form-actions"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {onCancel && (
          <motion.button
            type="button" 
            onClick={onCancel}
            className="cancel-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
        )}
        <motion.button 
          type="submit" 
          className="save-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {initial ? 'Update' : 'Save'}
        </motion.button>
      </motion.div>
    </motion.form>
  )
}
