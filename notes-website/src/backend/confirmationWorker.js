// confirmationWorker.js
import axios from 'axios'
import pool from './db.js'
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve('../../.env') }) // adjust to your project root

const BLOCKFROST_KEY = process.env.BLOCKFROST_KEY
const API_BASE = 'https://cardano-preview.blockfrost.io/api/v0'

async function checkPendingNotes() {
  try {
    const [pending] = await pool.query(
      "SELECT * FROM notes_blockchain WHERE status = 'pending' AND tx_hash IS NOT NULL"
    )

    for (const note of pending) {
      try {
        const res = await axios.get(`${API_BASE}/txs/${note.tx_hash}`, {
          headers: { project_id: BLOCKFROST_KEY }
        })

        if (res.status === 200) {
          // Update note to confirmed
          await pool.query(
            'UPDATE notes_blockchain SET status = ?, updated_at = NOW() WHERE id = ?',
            ['confirmed', note.id]
          )
          console.log(`Note ${note.id} confirmed on-chain (tx ${note.tx_hash})`)

          // Insert transaction record if not exists
          const [exists] = await pool.query(
            'SELECT id FROM transactions WHERE tx_hash = ?',
            [note.tx_hash]
          )
          if (exists.length === 0) {
            await pool.query(
              `INSERT INTO transactions (tx_hash, amount, sender, recipient, metadata, createdAt)
               VALUES (?, ?, ?, ?, ?, NOW())`,
              [
                note.tx_hash,
                null,
                note.address || null,
                null,
                JSON.stringify({ action: note.action, note: note.content })
              ]
            )
            console.log(`Inserted transaction record for ${note.tx_hash}`)
          }
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          // still pending, do nothing
        } else {
          console.error('Error checking tx via Blockfrost:', err.message)
        }
      }
    }
  } catch (err) {
    console.error('Worker error:', err.message)
  }
}

console.log('Confirmation worker started — checking every 20s')
setInterval(checkPendingNotes, 20000)
checkPendingNotes()
