import axios from 'axios'
import pool from './db.js'
import dotenv from 'dotenv'
dotenv.config()

const BLOCKFROST_KEY = process.env.BLOCKFROST_KEY || 'previewZ0LyqcrhipXE8eCnlu9GpXJrbpb0Vw9r'
const API_BASE = 'https://cardano-preview.blockfrost.io/api/v0'
const LABEL = '42819' 

async function noteExistsByTx(txHash) {
  const [rows] = await pool.query('SELECT id FROM notes WHERE tx_hash = ?', [txHash])
  return rows.length > 0
}

async function restoreNotesForAddress(address) {
  try {
    console.log('Fetching txs for', address)
    const txsRes = await axios.get(`${API_BASE}/addresses/${address}/txs`, {
      headers: { project_id: BLOCKFROST_KEY }
    })

    const txs = txsRes.data || []
    for (const tx of txs) {
      const txHash = tx.tx_hash
      // skip if already present locally
      if (await noteExistsByTx(txHash)) {
        continue
      }

      // fetch metadata for the tx
      try {
        const metaRes = await axios.get(`${API_BASE}/txs/${txHash}/metadata`, {
          headers: { project_id: BLOCKFROST_KEY }
        })

        // metaRes.data is array of metadata entries; find our label
        const entries = metaRes.data || []
        for (const entry of entries) {
          // entry.label could be '42819'
          if (String(entry.label) === LABEL) {
            // entry.json_metadata is whatever was stored by Blaze; structure may differ
            const json = entry.json_metadata || entry ? entry : null
            // attempt sensible extraction
            let action = null
            let content = null
            let note_id = null
            if (json) {
              // If stored as object-like
              action = json.action || null
              content = json.note || json.note_text || JSON.stringify(json)
            }
            // Insert as confirmed note
            await pool.query(
              `INSERT INTO notes (address, note_id, action, content, tx_hash, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, NOW())`,
              [address, note_id, action, content, txHash, 'confirmed']
            )
            console.log(`Restored note from tx ${txHash}`)
          }
        }
      } catch (err) {
        console.error(`Failed to fetch metadata for tx ${txHash}:`, err.message)
      }
    }
    console.log('Restore complete')
  } catch (err) {
    console.error('Restore error:', err.message)
  }
}

// Run if executed directly with node and provide address as arg:
// node backend/restoreFromChain.js addr1...
if (require.main === module) {
  const address = process.argv[2]
  if (!address) {
    console.error('Usage: node restoreFromChain.js <address>')
    process.exit(1)
  }
  restoreNotesForAddress(address).then(() => process.exit(0))
}

export default restoreNotesForAddress
