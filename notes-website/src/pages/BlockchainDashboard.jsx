import { Blaze, Blockfrost, Core, WebWallet } from '@blaze-cardano/sdk'
import { useState, useEffect } from 'react'

// HELPER FUNCTION: FORMAT CONTENT FOR METADATA (64-byte limit)
const formatContent = (content) => {
  if (!content) return Core.Metadatum.newText('')
  if (content.length <= 64) return Core.Metadatum.newText(content)
  const chunks = content.match(/.{1,64}/g) || []
  const list = new Core.MetadatumList()
  chunks.forEach(chunk => list.add(Core.Metadatum.newText(chunk)))
  return Core.Metadatum.newList(list)
}

function App() {
  const [wallets, setWallets] = useState([])
  const [walletApi, setWalletApi] = useState(null)
  const [selectedWallet, setSelectedWallet] = useState('')
  const [walletAddress, setWalletAddress] = useState('')

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState(0n)
  const [noteAction, setNoteAction] = useState('create')
  const [noteContent, setNoteContent] = useState('')
  const [notes, setNotes] = useState([])

  // Backend saved transactions (filtered by sender)
  const [savedTxs, setSavedTxs] = useState([])

  const [provider] = useState(() => new Blockfrost({
    network: 'cardano-preview',
    projectId: 'previewZ0LyqcrhipXE8eCnlu9GpXJrbpb0Vw9r'
  }))

  useEffect(() => {
    if (window.cardano) setWallets(Object.keys(window.cardano))
  }, [])

  // Load only this user's transactions
  const loadSavedTransactions = async (senderAddr) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/transaction?sender=${senderAddr}`
      )
      if (!res.ok) throw new Error('Failed to load saved transaction')
      const data = await res.json()
      setSavedTxs(data)
    } catch (err) {
      console.error('Error loading saved txs:', err)
    }
  }

  // Event handlers
  const handleWalletChange = (e) => setSelectedWallet(e.target.value)
  const handleRecipientChange = (e) => setRecipient(e.target.value)
  const handleAmountChange = (e) => {
    const v = e.target.value
    setAmount(v === '' ? 0n : BigInt(v))
  }
  const handleNoteActionChange = (e) => setNoteAction(e.target.value)
  const handleNoteContentChange = (e) => setNoteContent(e.target.value)

  // Connect wallet
  const handleConnectWallet = async () => {
    if (!selectedWallet || !window.cardano[selectedWallet]) return
    try {
      const api = await window.cardano[selectedWallet].enable()
      setWalletApi(api)
      const address = await api.getChangeAddress()
      setWalletAddress(address)

      await fetchNotes(api, address)

      // load ONLY this user's transactions
      await loadSavedTransactions(address)

    } catch (err) {
      console.error('Error connecting wallet:', err)
    }
  }

  // Submit Cardano transaction
  const handleSubmitTransaction = async () => {
    if (!walletApi) return alert('Connect your wallet first!')
    if (!recipient) return alert('Recipient address required!')
    if (!amount || amount <= 0n) return alert('Amount must be > 0')
    if (!noteContent && noteAction !== 'delete') return alert('Note content required!')

    try {
      const wallet = new WebWallet(walletApi)
      const blaze = await Blaze.from(provider, wallet)

      // Metadata label
      const metadata = new Map()
      const label = 42819n
      const metadatumMap = new Core.MetadatumMap()
      metadatumMap.insert(Core.Metadatum.newText('action'), Core.Metadatum.newText(noteAction))
      metadatumMap.insert(Core.Metadatum.newText('note'), formatContent(noteContent || ''))
      const createdAtIso = new Date().toISOString()
      metadatumMap.insert(Core.Metadatum.newText('created_at'), Core.Metadatum.newText(createdAtIso))
      const metadatum = Core.Metadatum.newMap(metadatumMap)
      metadata.set(label, metadatum)
      const finalMetadata = new Core.Metadata(metadata)

      // Build + sign transaction
      const tx = blaze.newTransaction().payLovelace(Core.Address.fromBech32(recipient), amount)
      tx.setMetadata(finalMetadata)

      const completedTx = await tx.complete()
      const signedTx = await blaze.signTransaction(completedTx)
      const txId = await blaze.provider.postTransactionToChain(signedTx)

      alert(`Transaction submitted! Hash: ${txId}`)
      setNoteContent('')

      // Save transaction in backend
      try {
        const res = await fetch("http://localhost:5000/api/transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tx_hash: txId,
            amount: amount.toString(),
            sender: walletAddress || null,
            recipient,
            metadata: {
              action: noteAction,
              note: noteContent,
              created_at: createdAtIso
            }
          })
        })

        if (res.ok) {
          await loadSavedTransactions(walletAddress) // reload filtered data
        }

      } catch (err) {
        console.error('Error saving to backend:', err)
      }

      // reload blockchain notes
      await fetchNotes(walletApi, walletAddress)
    } catch (err) {
      console.error('Error submitting transaction:', err)
      alert('Transaction failed. See console.')
    }
  }

  // Fetch on-chain notes via metadata
  const fetchNotes = async (api, rawAddress) => {
    try {
      const utxos = await api.getUtxos()
      const notesFromChain = []

      for (const utxo of utxos) {
        if (!utxo) continue
        const txHash = utxo.tx_hash
        try {
          const txMetadata = await provider.getTransactionMetadata(txHash)
          if (txMetadata && txMetadata[42819]) {
            notesFromChain.push(txMetadata[42819])
          }
        } catch { }
      }

      setNotes(notesFromChain.flat())
    } catch (err) {
      console.error('Error fetching notes:', err)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Notes App – Blockchain Simulation (Cardano)</h2>

      <div style={{ marginBottom: 10 }}>
        <label>Select Wallet: </label>
        <select value={selectedWallet} onChange={handleWalletChange}>
          <option value="">-- Choose Wallet --</option>
          {wallets.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      {walletApi ? (
        <p>Wallet Connected: {walletAddress}</p>
      ) : (
        <button onClick={handleConnectWallet}>Connect Wallet</button>
      )}

      <div style={{ marginTop: 20 }}>
        <label>Recipient Address: </label>
        <input type="text" value={recipient} onChange={handleRecipientChange} />
        <br />
        <label>Amount (lovelace): </label>
        <input type="number" value={amount.toString()} onChange={handleAmountChange} />
        <br />
        <label>Action: </label>
        <select value={noteAction} onChange={handleNoteActionChange}>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
        <br />
        {noteAction !== 'delete' && (
          <>
            <label>Note Content: </label>
            <input type="text" value={noteContent} onChange={handleNoteContentChange} />
            <br />
          </>
        )}
        <button onClick={handleSubmitTransaction} style={{ marginTop: 10 }}>
          Submit Note Action
        </button>
      </div>

      {/* Blockchain notes */}
      <div style={{ marginTop: 30 }}>
        <h3>Submitted Notes Found On-Chain</h3>
        {notes.length === 0 ? (
          <p>No notes found on blockchain yet.</p>
        ) : (
          <ul>
            {notes.map((n, idx) => (
              <li key={idx}>
                <pre>{JSON.stringify(n, null, 2)}</pre>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* User-specific saved transactions */}
      <div style={{ marginTop: 30 }}>
        <h3>Your Saved Transactions</h3>
        {savedTxs.length === 0 ? (
          <p>No transactions saved for this wallet.</p>
        ) : (
          <ul>
            {savedTxs.map((t) => (
              <li key={t.id} style={{ marginBottom: 12 }}>
                <div><strong>Hash:</strong> {t.tx_hash}</div>
                <div><strong>Amount:</strong> {t.amount}</div>
                <div><strong>Sender:</strong> {t.sender}</div>
                <div><strong>Recipient:</strong> {t.recipient}</div>
                <div><strong>Metadata:</strong> 
                  <pre style={{ display: 'inline' }}>
                    {JSON.stringify(t.metadata)}
                  </pre>
                </div>
                <div><small>Saved at: {new Date(t.createdAt).toLocaleString()}</small></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default App
