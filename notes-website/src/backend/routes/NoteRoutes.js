import express from 'express'
import pool from '../db.js'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// Create a pending note
router.post('/', async (req, res) => {
  try {
    const { address, action, content, tx_hash, status } = req.body

    if (!address || !action || !content) {
      return res.status(400).json({ error: 'Address, action, and content are required' })
    }

    const note_id = uuidv4()

    const [result] = await pool.query(
      `INSERT INTO notes (address, note_id, action, content, tx_hash, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [address, note_id, action, content, tx_hash || null, status || 'pending']
    )

    const [rows] = await pool.query('SELECT id, address, note_id, action, content, tx_hash, status, created_at, updated_at FROM notes WHERE id = ?', [result.insertId])
    res.json(rows[0])
  } catch (err) {
    console.error('Create note error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Get notes (optionally filter by address)
router.get('/', async (req, res) => {
  try {
    const { address } = req.query
    let query = 'SELECT id, address, note_id, action, content, tx_hash, status, created_at, updated_at FROM notes'
    const params = []

    if (address) {
      query += ' WHERE address = ?'
      params.push(address)
    }

    query += ' ORDER BY created_at DESC'
    const [rows] = await pool.query(query, params)
    res.json(rows)
  } catch (err) {
    console.error('Get notes error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Update note (e.g., set tx_hash, update status)
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id
    const { tx_hash, status } = req.body

    const updates = []
    const params = []

    if (tx_hash !== undefined) {
      updates.push('tx_hash = ?')
      params.push(tx_hash)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      params.push(status)
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })

    params.push(id)

    await pool.query(`UPDATE notes SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, params)
    const [rows] = await pool.query('SELECT id, address, note_id, action, content, tx_hash, status, created_at, updated_at FROM notes WHERE id = ?', [id])
    res.json(rows[0])
  } catch (err) {
    console.error('Update note error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
