// Banking service using localStorage for data persistence
const defaultBankData = {
  accounts: [],
  transactions: [],
  lastUpdated: new Date().toISOString()
};

// Helper function to get data from localStorage
const getLocalStorageData = (userId) => {
  const key = `bankData_${userId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultBankData;
};

// Helper function to save data to localStorage
const saveLocalStorageData = (userId, data) => {
  const key = `bankData_${userId}`;
  data.lastUpdated = new Date().toISOString();
  localStorage.setItem(key, JSON.stringify(data));
  // Dispatch a custom event to notify components of data changes
  window.dispatchEvent(new CustomEvent('bankDataUpdated', { detail: { userId } }));
};

// Helper function to get metadata or initialize if not exists
const getMetadata = async (user) => {
  if (!user) {
    console.error('No user provided to getMetadata');
    return defaultBankData;
  }

  try {
    let metadata = await getLocalStorageData(user.id);
    if (!metadata || !metadata.bankData) {
      metadata = { bankData: defaultBankData };
      await saveLocalStorageData(user.id, metadata.bankData);
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
    await saveLocalStorageData(user.id, newBankData);
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

// Transfer money between accounts or to external recipients
export const transferMoney = async (user, options) => {
  try {
    const { fromAccountId, toAccountId, recipientEmail, amount, description, paymentMethodId } = options;

    // Validate basic inputs
    if (!user || !amount || amount <= 0) {
      throw new Error('Invalid transfer parameters');
    }

    // Get user's banking data
    const bankData = await getMetadata(user);

    // Handle card payment transfer
    if (paymentMethodId && recipientEmail) {
      const transfer = {
        id: `card-transfer-${Date.now()}`,
        senderId: user.id,
        recipientEmail,
        amount,
        description,
        paymentMethodId,
        status: 'completed',
        timestamp: new Date().toISOString(),
      };

      // Add transfer to transactions
      bankData.transactions.unshift({
        id: transfer.id,
        type: 'card_payment',
        amount: -amount,
        description: `Card payment to ${recipientEmail}${description ? ': ' + description : ''}`,
        category: 'Card Payment',
        date: transfer.timestamp,
        paymentMethodId,
      });

      // Save updated data
      await updateMetadata(user, bankData);

      return {
        success: true,
        data: transfer,
      };
    }
    // Handle internal transfer between accounts
    else if (fromAccountId && toAccountId) {
      const fromAccount = bankData.accounts.find(acc => acc.id === fromAccountId);
      const toAccount = bankData.accounts.find(acc => acc.id === toAccountId);

      if (!fromAccount || !toAccount) {
        throw new Error('One or both accounts not found');
      }

      if (fromAccount.balance < amount) {
        throw new Error('Insufficient funds');
      }

      // Update account balances
      fromAccount.balance -= amount;
      toAccount.balance += amount;

      // Add transaction records
      const transactionId = `tr-${Date.now()}`;
      const timestamp = new Date().toISOString();

      bankData.transactions.unshift({
        id: transactionId,
        fromAccount: fromAccountId,
        toAccount: toAccountId,
        amount: amount,
        type: 'transfer',
        description: description || 'Internal Transfer',
        date: timestamp,
        status: 'completed'
      });

      // Save updated data
      await updateMetadata(user, bankData);

      return {
        success: true,
        data: {
          transactionId,
          fromAccount: fromAccount.id,
          toAccount: toAccount.id,
          amount,
          timestamp
        }
      };
    }
    // Handle bank transfer to external recipient
    else if (recipientEmail) {
      const transfer = {
        id: `transfer-${Date.now()}`,
        senderId: user.id,
        recipientEmail,
        amount,
        description,
        status: 'completed',
        timestamp: new Date().toISOString(),
      };

      // Add transfer to transactions
      bankData.transactions.unshift({
        id: transfer.id,
        type: 'external_transfer',
        amount: -amount,
        description: `Transfer to ${recipientEmail}${description ? ': ' + description : ''}`,
        category: 'Transfer',
        date: transfer.timestamp,
      });

      // Save updated data
      await updateMetadata(user, bankData);

      return {
        success: true,
        data: transfer,
      };
    }
    else {
      throw new Error('Invalid transfer parameters: must provide either account IDs, recipient email, or payment method');
    }
  } catch (error) {
    console.error('Transfer error:', error);
    return {
      success: false,
      error: error.message || 'Transfer failed'
    };
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

// Mock third-party API endpoints
const mockApiEndpoints = {
  balance: 'https://api.mockbank.com/balance',
  income: 'https://api.mockbank.com/income',
  expenses: 'https://api.mockbank.com/expenses'
};

// Mock API response delay
const simulateApiCall = async (data) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), 500);
  });
};

// Mock third-party API data
const mockThirdPartyData = {
  balance: {
    currentBalance: 250000.00,
    availableBalance: 245000.00,
    pendingTransactions: 5000.00,
    lastUpdated: new Date().toISOString()
  },
  income: {
    totalIncome: 750000.00,
    monthlySalary: 50000.00,
    bonuses: 20000.00,
    investments: 10000.00,
    otherIncome: 5000.00
  },
  expenses: {
    totalExpenses: 35000.00,
    categories: {
      housing: 15000.00,
      utilities: 3000.00,
      groceries: 4000.00,
      transportation: 2000.00,
      entertainment: 3000.00,
      healthcare: 4000.00,
      shopping: 4000.00
    }
  }
};

// Mock transactions
const generateMockTransactions = () => {
  const categories = ['Housing', 'Utilities', 'Groceries', 'Transportation', 'Entertainment', 'Healthcare', 'Shopping'];
  const descriptions = {
    Housing: ['Rent Payment', 'Property Tax', 'Home Insurance', 'Maintenance Charges'],
    Utilities: ['Electricity Bill', 'Water Bill', 'Internet Bill', 'Gas Bill'],
    Groceries: ['Big Bazaar', 'DMart', 'Reliance Fresh', 'More Supermarket'],
    Transportation: ['Petrol', 'Metro Card Recharge', 'Auto Fare', 'Car Service'],
    Entertainment: ['Netflix Subscription', 'PVR Cinemas', 'Restaurant Bill', 'BookMyShow'],
    Healthcare: ['Apollo Pharmacy', 'Doctor Consultation', 'Health Insurance', 'Lab Tests'],
    Shopping: ['Amazon.in', 'Flipkart', 'Myntra', 'Lifestyle']
  };

  const transactions = [];
  const currentDate = new Date();

  // Generate last 30 days of transactions
  for (let i = 0; i < 30; i++) {
    const numTransactions = Math.floor(Math.random() * 3) + 1; // 1-3 transactions per day
    
    for (let j = 0; j < numTransactions; j++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const descList = descriptions[category];
      const description = descList[Math.floor(Math.random() * descList.length)];
      
      // Generate amounts in Indian Rupee ranges
      let amount;
      switch (category) {
        case 'Housing':
          amount = Math.round(Math.random() * 15000 + 10000); // 10,000 - 25,000
          break;
        case 'Utilities':
          amount = Math.round(Math.random() * 2000 + 500); // 500 - 2,500
          break;
        case 'Groceries':
          amount = Math.round(Math.random() * 3000 + 500); // 500 - 3,500
          break;
        case 'Transportation':
          amount = Math.round(Math.random() * 1000 + 100); // 100 - 1,100
          break;
        case 'Entertainment':
          amount = Math.round(Math.random() * 2000 + 200); // 200 - 2,200
          break;
        case 'Healthcare':
          amount = Math.round(Math.random() * 3000 + 500); // 500 - 3,500
          break;
        case 'Shopping':
          amount = Math.round(Math.random() * 5000 + 500); // 500 - 5,500
          break;
        default:
          amount = Math.round(Math.random() * 2000 + 500); // 500 - 2,500
      }
      
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      
      transactions.push({
        id: `trans-${i}-${j}-${Date.now()}`,
        date: date.toISOString(),
        description,
        category,
        amount,
        type: Math.random() > 0.2 ? 'expense' : 'income',
        status: 'completed'
      });
    }
  }

  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Get account summary including balance and spending analytics
export const getAccountSummary = async (userId) => {
  try {
    const data = getLocalStorageData(userId);
    
    // Simulate third-party API calls
    const [balanceData, incomeData, expensesData] = await Promise.all([
      simulateApiCall(mockThirdPartyData.balance),
      simulateApiCall(mockThirdPartyData.income),
      simulateApiCall(mockThirdPartyData.expenses)
    ]);

    // Initialize transactions if empty
    if (!data.transactions || data.transactions.length === 0) {
      data.transactions = generateMockTransactions();
      saveLocalStorageData(userId, data);
    }

    const recentTransactions = data.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return {
      success: true,
      data: {
        balance: balanceData,
        income: incomeData,
        expenses: expensesData,
        recentTransactions,
        accountCount: data.accounts.length || 1,
        lastUpdated: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error getting account summary:', error);
    return { success: false, error: 'Failed to get account summary' };
  }
};

// Get all transactions with optional pagination
export const getRecentTransactions = async (userId, page = 1, limit = 20) => {
  try {
    const data = getLocalStorageData(userId);
    
    // Initialize transactions if empty
    if (!data.transactions || data.transactions.length === 0) {
      data.transactions = generateMockTransactions();
      saveLocalStorageData(userId, data);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedTransactions = data.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(startIndex, endIndex);

    return {
      success: true,
      transactions: paginatedTransactions,
      totalCount: data.transactions.length,
      currentPage: page,
      totalPages: Math.ceil(data.transactions.length / limit)
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return {
      success: false,
      error: 'Failed to fetch transactions'
    };
  }
};

// Get spending analytics
export const getSpendingAnalytics = async (userId, timeframe = 'month') => {
  try {
    const data = getLocalStorageData(userId);
    const transactions = data.transactions || [];
    
    // Convert spending by category to array format
    const spendingByCategory = Object.entries(
      transactions.reduce((acc, trans) => {
        if (!acc[trans.category]) {
          acc[trans.category] = 0;
        }
        acc[trans.category] += trans.amount;
        return acc;
      }, {})
    ).map(([category, amount]) => ({
      category,
      amount
    }));

    return {
      success: true,
      data: {
        totalSpending: transactions.reduce((sum, trans) => sum + trans.amount, 0),
        spendingByCategory,
        monthOverMonth: [
          { month: 'Jan', amount: 2200 },
          { month: 'Feb', amount: 2400 },
          { month: 'Mar', amount: 2100 },
          { month: 'Apr', amount: 2500 },
          { month: 'May', amount: 2300 },
          { month: 'Jun', amount: 2600 }
        ],
        topCategories: Object.entries(spendingByCategory)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([category]) => category)
      }
    };
  } catch (error) {
    console.error('Error fetching spending analytics:', error);
    return {
      success: false,
      error: 'Failed to fetch spending analytics'
    };
  }
};

// Helper function to format currency in Indian Rupees
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0, // Remove decimal places
  }).format(amount);
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

    const data = getLocalStorageData(userId);
    data.transactions.push(newTransaction);
    saveLocalStorageData(userId, data);

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
