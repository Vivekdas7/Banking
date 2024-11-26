// Banking service using Clerk's user metadata
const defaultBankData = {
  accounts: [],
  transactions: [],
};

// Helper function to get metadata or initialize if not exists
const getMetadata = async (user) => {
  if (!user) {
    console.error('No user provided to getMetadata');
    return defaultBankData;
  }

  try {
    let metadata = await user.metadata;
    if (!metadata || !metadata.bankData) {
      metadata = { bankData: defaultBankData };
      await user.update({
        publicMetadata: metadata
      });
    }
    return metadata.bankData;
  } catch (error) {
    console.error('Error getting metadata:', error);
    return defaultBankData;
  }
};

// Helper function to update metadata
const updateMetadata = async (user, newBankData) => {
  if (!user) {
    console.error('No user provided to updateMetadata');
    return false;
  }

  try {
    await user.update({
      publicMetadata: {
        ...user.publicMetadata,
        bankData: newBankData
      }
    });
    return true;
  } catch (error) {
    console.error('Error updating metadata:', error);
    return false;
  }
};

// Get banking data from user metadata
const getBankingData = async (user) => {
  try {
    const metadata = await getMetadata(user);
    return metadata;
  } catch (error) {
    console.error('Error getting banking data:', error);
    return defaultBankData;
  }
};

// Save banking data to user metadata
const saveBankingData = async (user, data) => {
  try {
    await updateMetadata(user, data);
  } catch (error) {
    console.error('Error saving banking data:', error);
    throw error;
  }
};

// Add bank account
export const addBankAccount = async (user, accountData) => {
  try {
    const data = await getBankingData(user);
    const newAccount = {
      id: Date.now().toString(),
      ...accountData,
      createdAt: new Date().toISOString(),
    };
    data.accounts.push(newAccount);
    await saveBankingData(user, data);
    return { success: true, account: newAccount };
  } catch (error) {
    console.error('Error adding bank account:', error);
    return { success: false, error: 'Failed to add bank account' };
  }
};

// Get user's bank accounts
export const getBankAccounts = async (user) => {
  try {
    const data = await getBankingData(user);
    return { 
      success: true, 
      accounts: data.accounts 
    };
  } catch (error) {
    console.error('Error getting bank accounts:', error);
    return { success: false, error: 'Failed to get bank accounts' };
  }
};

// Transfer money between accounts
export const transferMoney = async (user, fromAccountId, toAccountId, amount, description) => {
  try {
    const data = await getBankingData(user);
    const fromAccount = data.accounts.find(acc => acc.id === fromAccountId);
    const toAccount = data.accounts.find(acc => acc.id === toAccountId);

    if (!fromAccount || !toAccount) {
      return { success: false, error: 'Account not found' };
    }

    if (fromAccount.balance < amount) {
      return { success: false, error: 'Insufficient funds' };
    }

    // Update account balances
    fromAccount.balance -= amount;
    toAccount.balance += amount;

    // Create transaction records
    const transactionId = Date.now().toString();
    const timestamp = new Date().toISOString();

    const debitTransaction = {
      id: `${transactionId}-debit`,
      type: 'debit',
      amount,
      description,
      fromAccount: fromAccountId,
      toAccount: toAccountId,
      timestamp,
      status: 'completed'
    };

    const creditTransaction = {
      id: `${transactionId}-credit`,
      type: 'credit',
      amount,
      description,
      fromAccount: fromAccountId,
      toAccount: toAccountId,
      timestamp,
      status: 'completed'
    };

    data.transactions.push(debitTransaction, creditTransaction);
    await saveBankingData(user, data);

    return { 
      success: true, 
      debitTransaction, 
      creditTransaction,
      fromAccount,
      toAccount
    };
  } catch (error) {
    console.error('Error transferring money:', error);
    return { success: false, error: 'Failed to transfer money' };
  }
};

// Get account transactions
export const getAccountTransactions = async (user, accountId) => {
  try {
    const data = await getBankingData(user);
    const transactions = data.transactions.filter(
      trans => trans.fromAccount === accountId || trans.toAccount === accountId
    );
    return { success: true, transactions };
  } catch (error) {
    console.error('Error getting transactions:', error);
    return { success: false, error: 'Failed to get transactions' };
  }
};

// Get account details
export const getAccountDetails = async (user, accountId) => {
  try {
    const data = await getBankingData(user);
    const account = data.accounts.find(acc => acc.id === accountId);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }
    return { success: true, account };
  } catch (error) {
    console.error('Error getting account details:', error);
    return { success: false, error: 'Failed to get account details' };
  }
};

export const getAccountBalance = async (user) => {
  if (!user) {
    console.error('No user provided to getAccountBalance');
    return {
      success: false,
      error: 'User not found'
    };
  }

  try {
    const bankData = await getMetadata(user);
    const transactions = bankData.transactions || [];
    
    const balance = transactions.reduce((total, transaction) => {
      if (transaction.type === 'credit') {
        return total + transaction.amount;
      } else {
        return total - transaction.amount;
      }
    }, 1000); // Start with $1000 initial balance

    return {
      success: true,
      balance: balance
    };
  } catch (error) {
    console.error('Error getting account balance:', error);
    return {
      success: false,
      error: 'Failed to get account balance'
    };
  }
};

// Mock data for testing
const mockAccountData = {
  balance: 5000.00,
  totalIncome: 7500.00,
  totalExpenses: 2500.00,
  monthlySpending: 2500.00,
  spendingByCategory: [
    { category: 'Groceries', amount: 500 },
    { category: 'Entertainment', amount: 300 },
    { category: 'Utilities', amount: 400 },
    { category: 'Transportation', amount: 200 },
    { category: 'Shopping', amount: 600 },
  ]
};

const mockAnalytics = {
  totalSpending: 2500.00,
  spendingByCategory: [
    { category: 'Groceries', amount: 500 },
    { category: 'Entertainment', amount: 300 },
    { category: 'Utilities', amount: 400 },
    { category: 'Transportation', amount: 200 },
    { category: 'Shopping', amount: 600 },
  ],
  monthOverMonth: [
    { month: 'Jan', amount: 2200 },
    { month: 'Feb', amount: 2400 },
    { month: 'Mar', amount: 2100 },
    { month: 'Apr', amount: 2500 },
    { month: 'May', amount: 2300 },
    { month: 'Jun', amount: 2600 }
  ],
  topCategories: ['Shopping', 'Groceries', 'Utilities']
};

// Helper function to format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Get account summary including balance and spending analytics
export const getAccountSummary = async (userId) => {
  try {
    // For now, return mock data
    return {
      success: true,
      data: mockAccountData
    };
  } catch (error) {
    console.error('Error fetching account summary:', error);
    return {
      success: false,
      error: 'Failed to fetch account summary'
    };
  }
};

// Get all transactions with optional pagination
export const getRecentTransactions = async (userId, page = 1, limit = 20) => {
  try {
    // For now, return mock transactions
    const mockTransactions = [
      {
        id: '1',
        description: 'Grocery Shopping - Whole Foods',
        amount: 156.78,
        type: 'debit',
        category: 'Groceries',
        date: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        description: 'Salary Deposit',
        amount: 3500.00,
        type: 'credit',
        category: 'Income',
        date: '2024-01-14T09:00:00Z'
      },
      // Add more mock transactions as needed
    ];

    return {
      success: true,
      transactions: mockTransactions
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return {
      success: false,
      error: 'Failed to fetch transactions'
    };
  }
};

// Add a new transaction
export const addTransaction = async (userId, transactionData) => {
  try {
    const newTransaction = {
      id: String(Date.now()),
      userId,
      description: transactionData.description,
      amount: parseFloat(transactionData.amount),
      type: transactionData.type,
      category: transactionData.category,
      date: new Date().toISOString(),
    };

    // In a real app, this would be saved to the database
    // For now, just return the new transaction
    return {
      success: true,
      transaction: newTransaction
    };
  } catch (error) {
    console.error('Error adding transaction:', error);
    return {
      success: false,
      error: 'Failed to add transaction'
    };
  }
};

// Get spending analytics
export const getSpendingAnalytics = async (userId, timeframe = 'month') => {
  try {
    // For now, return mock analytics
    return {
      success: true,
      data: mockAnalytics
    };
  } catch (error) {
    console.error('Error fetching spending analytics:', error);
    return {
      success: false,
      error: 'Failed to fetch spending analytics'
    };
  }
};

// Transfer money between users
export const transferMoneyBetweenUsers = async ({ senderId, recipientEmail, amount, description }) => {
  try {
    // Validate inputs
    if (!senderId || !recipientEmail || !amount) {
      throw new Error('Missing required transfer information');
    }

    // In a real app, this would be an API call
    // For now, we'll simulate a transfer with mock data
    const transfer = {
      id: `transfer-${Date.now()}`,
      senderId,
      recipientEmail,
      amount,
      description,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add transfer to mock transactions
    mockTransactions.unshift({
      id: transfer.id,
      type: 'transfer',
      amount: -amount,
      description: `Transfer to ${recipientEmail}${description ? ': ' + description : ''}`,
      category: 'Transfer',
      date: transfer.timestamp,
    });

    return {
      success: true,
      data: transfer,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Transfer failed',
    };
  }
};
