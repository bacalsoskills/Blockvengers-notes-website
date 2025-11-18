import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TransactionForm from '../components/TransactionForm.jsx'
import BlockchainService from '../services/blockchainService.js'

export default function BlockchainDashboard() {
  const [accountInfo, setAccountInfo] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [adaPrice, setAdaPrice] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const [account, txHistory, price] = await Promise.all([
        BlockchainService.getAccountInfo(),
        BlockchainService.getTransactionHistory(),
        BlockchainService.getADAPrice()
      ])
      
      setAccountInfo(account)
      setTransactions(txHistory)
      setAdaPrice(price)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransactionComplete = (transaction) => {
    // Add new transaction to the list
    setTransactions(prev => [transaction, ...prev])
    
    // Update account balance
    if (accountInfo) {
      const newBalance = accountInfo.balance - (transaction.amount + transaction.fee)
      setAccountInfo(prev => ({
        ...prev,
        balance: newBalance,
        balanceADA: (newBalance / 1000000).toFixed(6)
      }))
    }
    
    setShowTransactionForm(false)
  }

  const formatAmount = (lovelace) => {
    return (Math.abs(lovelace) / 1000000).toFixed(6)
  }

  const formatCurrency = (ada, rate) => {
    return (parseFloat(ada) * rate).toFixed(2)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-large"></div>
        <p>Loading blockchain data...</p>
      </div>
    )
  }

  return (
    <motion.div 
      className="blockchain-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="dashboard-header">
        <h1>Blockchain Dashboard</h1>
        <p>Manage your Cardano (ADA) transactions</p>
      </div>

      {/* Account Overview */}
      <motion.div 
        className="account-overview"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="balance-card">
          <div className="balance-header">
            <h3>Your Balance</h3>
            <div className="wallet-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <path d="m9 9 3 3-3 3"></path>
              </svg>
            </div>
          </div>
          <div className="balance-amount">
            <span className="ada-amount">{accountInfo?.balanceADA} ADA</span>
            {adaPrice && (
              <div className="fiat-amounts">
                <span>${formatCurrency(accountInfo?.balanceADA, adaPrice.usd)} USD</span>
                <span>€{formatCurrency(accountInfo?.balanceADA, adaPrice.eur)} EUR</span>
              </div>
            )}
          </div>
          <div className="wallet-address">
            <small>Address: {accountInfo?.address?.slice(0, 20)}...</small>
          </div>
        </div>

        {adaPrice && (
          <div className="price-card">
            <h4>ADA Price</h4>
            <div className="price-list">
              <div className="price-item">
                <span>USD</span>
                <span>${adaPrice.usd}</span>
              </div>
              <div className="price-item">
                <span>EUR</span>
                <span>€{adaPrice.eur}</span>
              </div>
              <div className="price-item">
                <span>BTC</span>
                <span>{adaPrice.btc} ₿</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div 
        className="dashboard-actions"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <button
          className="btn-primary action-btn"
          onClick={() => setShowTransactionForm(true)}
          disabled={showTransactionForm}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m7 11 5-5 5 5"></path>
            <path d="m12 6 0 12"></path>
          </svg>
          Send ADA
        </button>
        
        <button 
          className="btn-secondary action-btn"
          onClick={loadDashboardData}
          disabled={isLoading}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2v6h-6"></path>
            <path d="M21 13a9 9 0 1 1-3-7.7L21 8"></path>
          </svg>
          Refresh
        </button>
      </motion.div>

      {/* Transaction Form */}
      <AnimatePresence>
        {showTransactionForm && (
          <motion.div className="form-overlay">
            <TransactionForm
              onTransactionComplete={handleTransactionComplete}
              onCancel={() => setShowTransactionForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction History */}
      <motion.div 
        className="transaction-history"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3>Recent Transactions</h3>
        {transactions.length === 0 ? (
          <div className="empty-transactions">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <path d="m9 9 3 3-3 3"></path>
            </svg>
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.hash || index}
                className={`transaction-item ${tx.amount < 0 ? 'outgoing' : 'incoming'}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="tx-icon">
                  {tx.amount < 0 ? (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m7 11 5-5 5 5"></path>
                      <path d="m12 6 0 12"></path>
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m17 13-5 5-5-5"></path>
                      <path d="m12 6 0 12"></path>
                    </svg>
                  )}
                </div>
                <div className="tx-details">
                  <div className="tx-hash">{tx.hash?.slice(0, 16)}...</div>
                  <div className="tx-date">{formatDate(tx.timestamp)}</div>
                  {tx.message && <div className="tx-message">{tx.message}</div>}
                </div>
                <div className="tx-amount">
                  <span className={tx.amount < 0 ? 'negative' : 'positive'}>
                    {tx.amount < 0 ? '-' : '+'}{formatAmount(tx.amount)} ADA
                  </span>
                  <div className="tx-status">{tx.status}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}