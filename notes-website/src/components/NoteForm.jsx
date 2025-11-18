import { useEffect, useState } from 'react'

export default function NoteForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [body, setBody] = useState(initial?.body || '')
  const [color, setColor] = useState(initial?.color || 'yellow')

  useEffect(() => {
    setTitle(initial?.title || '')
    setBody(initial?.body || '')
    setColor(initial?.color || 'yellow')
  }, [initial])

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim() && !body.trim()) return
    onSave({ title: title.trim(), body: body.trim(), color })
  }

  return (
    <form className="note-form" onSubmit={submit}>
      <div className="row">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <select value={color} onChange={(e) => setColor(e.target.value)}>
          <option value="yellow">Yellow</option>
          <option value="pink">Pink</option>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
        </select>
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your note..." />
      <div className="actions">
        <button type="submit" className="primary">Save</button>
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}


