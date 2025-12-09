import { useState } from 'react'
import { motion } from 'framer-motion'
import BlockchainService from '../services/blockchainService.js'

export default function TransactionForm({ onTransactionComplete, onCancel }) {
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!recipientAddress.trim()) {
      newErrors.recipientAddress = 'Recipient address is required'
    } else if (!BlockchainService.validateAddress(recipientAddress)) {
      newErrors.recipientAddress = 'Invalid Cardano address format'
    }

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required'
    } else if (isNaN(amount) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number'
    } else if (parseFloat(amount) < 1) {
      newErrors.amount = 'Minimum amount is 1 ADA'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const transaction = await BlockchainService.createTransaction(
        recipientAddress.trim(),
        parseFloat(amount),
        message.trim()
      )
      
      // Create a note for this transaction
      try {
        const noteTitle = `Transaction to ${recipientAddress.trim().substring(0, 20)}...`
        const noteContent = `Amount: ${amount} ADA\nRecipient: ${recipientAddress.trim()}\n${message.trim() ? `Message: ${message.trim()}\n` : ''}Transaction Hash: ${transaction.hash}\nStatus: ${transaction.status}\nDate: ${new Date(transaction.timestamp).toLocaleString()}`
        
        await fetch('http://localhost:5000/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: noteTitle,
            content: noteContent,
            color: 'blue',
            category: 'Blockchain Transaction',
            tags: JSON.stringify(['transaction', 'blockchain', 'ADA']),
            pinned: false,
            favorite: false
          })
        })
      } catch (noteError) {
        console.error('Failed to create note for transaction:', noteError)
        // Don't fail the transaction if note creation fails
      }
      
      onTransactionComplete?.(transaction)
    } catch (error) {
      setErrors({ submit: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="transaction-form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="transaction-form-header">
        <h3>Send ADA Transaction</h3>
        <p>Send Cardano (ADA) to another wallet address</p>
      </div>

      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="form-group">
          <label htmlFor="recipient">Recipient Address *</label>
          <input
            id="recipient"
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="addr_test1q..."
            className={`form-input ${errors.recipientAddress ? 'error' : ''}`}
            disabled={isLoading}
          />
          {errors.recipientAddress && (
            <span className="error-message">{errors.recipientAddress}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount (ADA) *</label>
          <input
            id="amount"
            type="number"
            step="0.000001"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10.5"
            className={`form-input ${errors.amount ? 'error' : ''}`}
            disabled={isLoading}
          />
          {errors.amount && (
            <span className="error-message">{errors.amount}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="message">Message (Optional)</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional transaction note..."
            className="form-textarea"
            rows={3}
            maxLength={200}
            disabled={isLoading}
          />
          <small className="char-count">{message.length}/200</small>
        </div>

        {errors.submit && (
          <div className="error-banner">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            {errors.submit}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Processing...
              </>
            ) : (
              'Send Transaction'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  )
}