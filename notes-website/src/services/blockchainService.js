// Blockchain service for Cardano transactions
// Note: BlockFrost API removed to avoid browser compatibility issues
// In production, use server-side API calls or Web3 wallet integration

// Mock wallet for demo purposes
const MOCK_WALLET = {
  address: 'addr_test1qpw0djgj0x59ngrjvqthn7enhvruxnsavsw5th63la3mjel3tkc974sr23jmlzgq5zda4gtv8k9cy38756r9y3qgmkqqjz6aa7',
  balance: 1000000000, // 1000 ADA in lovelace
  utxos: []
};

export class BlockchainService {
  // Get account information
  static async getAccountInfo(address) {
    try {
      // In production, use server-side API or wallet connection
      // For demo, return mock data
      return {
        address: MOCK_WALLET.address,
        balance: MOCK_WALLET.balance,
        balanceADA: (MOCK_WALLET.balance / 1000000).toFixed(6)
      };
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  }

  // Get transaction history
  static async getTransactionHistory(address) {
    try {
      // In production, use server-side API or wallet connection
      // For demo, return mock transactions
      return [
        {
          hash: '1234567890abcdef',
          timestamp: new Date().toISOString(),
          amount: '-50000000',
          fee: '200000',
          status: 'confirmed'
        },
        {
          hash: 'abcdef1234567890',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          amount: '+100000000',
          fee: '0',
          status: 'confirmed'
        }
      ];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  // Create a simple transaction
  static async createTransaction(recipientAddress, amount, message = '') {
    try {
      // Validate inputs
      if (!recipientAddress || !amount) {
        throw new Error('Recipient address and amount are required');
      }

      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const amountLovelace = Math.floor(amount * 1000000); // Convert ADA to lovelace
      
      if (amountLovelace > MOCK_WALLET.balance) {
        throw new Error('Insufficient balance');
      }

      // In a real application, you would:
      // 1. Build the transaction using Cardano libraries
      // 2. Sign it with the user's wallet
      // 3. Submit it to the blockchain
      
      // For demo purposes, simulate transaction creation
      const mockTransaction = {
        hash: this.generateTxHash(),
        from: MOCK_WALLET.address,
        to: recipientAddress,
        amount: amountLovelace,
        amountADA: amount,
        fee: 200000, // ~0.2 ADA fee
        message: message,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update mock wallet balance
      MOCK_WALLET.balance -= (amountLovelace + mockTransaction.fee);
      
      return {
        ...mockTransaction,
        status: 'submitted'
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Generate a mock transaction hash
  static generateTxHash() {
    return Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  // Validate Cardano address format
  static validateAddress(address) {
    // Basic validation for Cardano address format
    const addressRegex = /^(addr|addr_test)1[a-z0-9]{58}$/;
    return addressRegex.test(address);
  }

  // Get current ADA price (mock)
  static async getADAPrice() {
    // In production, fetch from a price API like CoinGecko
    return {
      usd: 0.45,
      eur: 0.42,
      btc: 0.000012
    };
  }
}

export default BlockchainService;