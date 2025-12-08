import { Blaze, Blockfrost, Core, WebWallet } from '@blaze-cardano/sdk'
import { useState, useEffect } from 'react'
import '../styles/blockchainDashboard.css'

// HELPER FUNCTION: FORMAT CONTENT FOR METADATA (64-byte limit)
const formatContent = (content) => {
  if (!content) return Core.Metadatum.newText('')
  if (content.length <= 64) return Core.Metadatum.newText(content)

  const chunks = content.match(/.{1,64}/g) || []
  const list = new Core.MetadatumList()
  chunks.forEach(chunk => list.add(Core.Metadatum.newText(chunk)))
  return Core.Metadatum.newList(list)
}

const backendUrl = 'http://localhost:5000' // full backend URL

function BlockchainDashboard() {
  const [wallets, setWallets] = useState([])
  const [walletApi, setWalletApi] = useState(null)
  const [selectedWallet, setSelectedWallet] = useState('')
  const [walletAddress, setWalletAddress] = useState('')

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState(0n)
  const [noteAction, setNoteAction] = useState('create')
  const [noteContent, setNoteContent] = useState('')
  const [notes, setNotes] = useState([])
  const [savedTxs, setSavedTxs] = useState([])

  const [provider] = useState(() =>
    new Blockfrost({
      network: 'cardano-preview',
      projectId: 'previewZ0LyqcrhipXE8eCnlu9GpXJrbpb0Vw9r'
    })
  )

  useEffect(() => {
    if (window.cardano) setWallets(Object.keys(window.cardano))
  }, [])

  // Load local notes from backend (notes_blockchain)
  const loadLocalNotes = async (address) => {
    try {
      const url = address
        ? `${backendUrl}/api/notes_blockchain?address=${encodeURIComponent(address)}`
        : `${backendUrl}/api/notes_blockchain`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load notes')
      const data = await res.json()
      setNotes(data)
    } catch (err) {
      console.error('Error loading local notes:', err)
    }
  }

  const loadSavedTransactions = async (senderAddr) => {
    try {
      const url = senderAddr
        ? `${backendUrl}/api/transaction?sender=${encodeURIComponent(senderAddr)}`
        : `${backendUrl}/api/transaction`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load saved transactions')
      const data = await res.json()
      setSavedTxs(data)
    } catch (err) {
      console.error('Error loading saved txs:', err)
    }
  }

  const handleWalletChange = (e) => setSelectedWallet(e.target.value)
  const handleRecipientChange = (e) => setRecipient(e.target.value)
  const handleAmountChange = (e) => {
    const v = e.target.value
    setAmount(v === '' ? 0n : BigInt(v))
  }
  const handleNoteActionChange = (e) => setNoteAction(e.target.value)
  const handleNoteContentChange = (e) => setNoteContent(e.target.value)

  const handleConnectWallet = async () => {
    if (!selectedWallet || !window.cardano[selectedWallet]) return

    try {
      const api = await window.cardano[selectedWallet].enable()
      setWalletApi(api)

      const address = await api.getChangeAddress()
      setWalletAddress(address)

      await loadLocalNotes(address)
      await loadSavedTransactions(address)

      // Refresh notes every 2 seconds
      setInterval(() => {
        loadLocalNotes(address)
        loadSavedTransactions(address)
      }, 2000)
    } catch (err) {
      console.error('Error connecting wallet:', err)
    }
  }

  const handleSubmitTransaction = async () => {
    if (!walletApi) return alert('Connect your wallet first!')
    if (!recipient) return alert('Recipient address required!')
    if (!amount || amount <= 0n) return alert('Amount must be > 0')
    if (!noteContent && noteAction !== 'delete') return alert('Note content required!')

    let noteRow
    try {
      const res = await fetch(`${backendUrl}/api/notes_blockchain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress || null,
          note_id: null,
          action: noteAction,
          content: noteContent,
          tx_hash: null,
          status: 'pending'
        })
      })
      if (!res.ok) throw new Error('Failed to create local note')
      noteRow = await res.json()
      setNotes(prev => [noteRow, ...prev])
    } catch (err) {
      console.error('Error creating pending note:', err)
      alert('Failed to save note locally. See console.')
      return
    }

    try {
      const wallet = new WebWallet(walletApi)
      const blaze = await Blaze.from(provider, wallet)

      const metadata = new Map()
      const label = 42819n
      const metadatumMap = new Core.MetadatumMap()
      metadatumMap.insert(Core.Metadatum.newText('action'), Core.Metadatum.newText(noteAction))
      metadatumMap.insert(Core.Metadatum.newText('note'), formatContent(noteContent || ''))
      metadatumMap.insert(Core.Metadatum.newText('created_at'), Core.Metadatum.newText(new Date().toISOString()))

      const metadatum = Core.Metadatum.newMap(metadatumMap)
      metadata.set(label, metadatum)
      const finalMetadata = new Core.Metadata(metadata)

      const tx = blaze.newTransaction().payLovelace(Core.Address.fromBech32(recipient), amount)
      tx.setMetadata(finalMetadata)

      const completedTx = await tx.complete()
      const signedTx = await blaze.signTransaction(completedTx)
      const txId = await blaze.provider.postTransactionToChain(signedTx)

      // Update local note with tx_hash
      await fetch(`${backendUrl}/api/notes_blockchain/${noteRow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_hash: txId, status: 'pending' })
      })

      // Save transaction record
      await fetch(`${backendUrl}/api/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_hash: txId,
          amount: amount.toString(),
          sender: walletAddress || null,
          recipient,
          metadata: { action: noteAction, note: noteContent, created_at: new Date().toISOString() }
        })
      })

      await loadLocalNotes(walletAddress)
      await loadSavedTransactions(walletAddress)

      alert(`Transaction submitted! Hash: ${txId}`)
      setNoteContent('')
    } catch (err) {
      console.error('Error submitting transaction:', err)
      alert('Transaction failed. See console.')
    }
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Cardano Notes Dashboard</h1>

      {/* WALLET CARD */}
      <div className="card">
        <h2 className="card-title">Wallet</h2>
        <select className="input" value={selectedWallet} onChange={handleWalletChange}>
          <option value="">-- Choose Wallet --</option>
          {wallets.map(w => <option key={w} value={w}>{w}</option>)}
        </select>

        {walletApi ? (
          <p className="wallet-connected">Connected: {walletAddress}</p>
        ) : (
          <button className="btn-primary" onClick={handleConnectWallet}>Connect Wallet</button>
        )}
      </div>

      {/* SUBMIT NOTE */}
      <div className="card">
        <h2 className="card-title">Submit Note</h2>
        <input className="input" type="text" value={recipient} onChange={handleRecipientChange} placeholder="Recipient Address" />
        <input className="input" type="number" value={amount.toString()} onChange={handleAmountChange} placeholder="Amount (lovelace)" />
        <select className="input" value={noteAction} onChange={handleNoteActionChange}>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
        {noteAction !== 'delete' && (
          <input className="input" type="text" value={noteContent} onChange={handleNoteContentChange} placeholder="Note Content" />
        )}
        <button className="btn-primary" onClick={handleSubmitTransaction}>Submit</button>
      </div>

      {/* LOCAL NOTES */}
      <div className="card">
        <h2 className="card-title">Your Local Notes (cache)</h2>
        {notes.length === 0 ? (
          <p className="empty-text">No local notes found.</p>
        ) : (
          <ul className="list">
            {notes.map(n => (
              <li key={n.id} className="list-item">
                <div><strong>Content:</strong> {n.content}</div>
                <div><strong>Action:</strong> {n.action}</div>
                <div><strong>Tx:</strong> {n.tx_hash || '—'}</div>
                <div><strong>Status:</strong> {n.status}</div>
                <div><small>Saved: {new Date(n.created_at).toLocaleString()}</small></div>
                <div><small>Updated: {n.updated_at ? new Date(n.updated_at).toLocaleString() : '—'}</small></div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SAVED TRANSACTIONS */}
      <div className="card">
        <h2 className="card-title">Saved Transactions</h2>
        {savedTxs.length === 0 ? (
          <p className="empty-text">No saved transactions.</p>
        ) : (
          <ul className="list">
            {savedTxs.map(t => (
              <li key={t.id} className="list-item">
                <strong>Hash:</strong> {t.tx_hash}<br />
                <strong>Amount:</strong> {t.amount}<br />
                <strong>Sender:</strong> {t.sender}<br />
                <strong>Recipient:</strong> {t.recipient}<br />
                <strong>Metadata:</strong>
                <pre>{JSON.stringify(t.metadata, null, 2)}</pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default BlockchainDashboard
