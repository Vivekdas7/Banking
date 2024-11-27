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
    currentBalance: 25000.00,
    availableBalance: 24500.00,
    pendingTransactions: 500.00,
    lastUpdated: new Date().toISOString()
  },
  income: {
    totalIncome: 75000.00,
    monthlySalary: 5000.00,
    bonuses: 2000.00,
    investments: 1000.00,
    otherIncome: 500.00
  },
  expenses: {
    totalExpenses: 3500.00,
    categories: {
      housing: 1500.00,
      utilities: 300.00,
      groceries: 400.00,
      transportation: 200.00,
      entertainment: 300.00,
      healthcare: 400.00,
      shopping: 400.00
    }
  }
};

// Generate mock transactions
const generateMockTransactions = (count = 10) => {
  const categories = ['Food', 'Shopping', 'Transport', 'Entertainment', 'Bills', 'Salary', 'Investment'];
  const descriptions = {
    Food: ['Swiggy Order', 'Zomato Delivery', 'Restaurant Bill', 'Grocery Shopping'],
    Shopping: ['Amazon.in', 'Flipkart', 'Myntra', 'Local Market'],
    Transport: ['Uber Ride', 'Ola Cabs', 'Metro Card Recharge', 'Fuel'],
    Entertainment: ['Netflix', 'Amazon Prime', 'Movie Tickets', 'Gaming'],
    Bills: ['Electricity Bill', 'Water Bill', 'Internet Bill', 'Mobile Recharge'],
    Salary: ['Monthly Salary', 'Bonus', 'Incentives'],
    Investment: ['Mutual Fund', 'Fixed Deposit', 'Stocks', 'PPF'],
  };

  return Array.from({ length: count }, () => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const description = descriptions[category][Math.floor(Math.random() * descriptions[category].length)];
    const type = category === 'Salary' ? 'income' : 'expense';
    const baseAmount = type === 'income' ? 
      Math.random() * 100000 + 50000 : // Income: ₹50,000 to ₹150,000
      Math.random() * 5000 + 100;      // Expense: ₹100 to ₹5,100
    
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      description,
      category,
      amount: Math.round(baseAmount * 100) / 100,
      type,
      status: Math.random() > 0.1 ? 'completed' : 'pending',
    };
  });
};

// Get account summary including balance and spending analytics
export const getAccountSummary = async (userId) => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock data
    const transactions = generateMockTransactions(20);
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      success: true,
      data: {
        balance: {
          currentBalance: 250000, // ₹2,50,000
          availableBalance: 225000, // ₹2,25,000
          pendingTransactions: 25000, // ₹25,000
        },
        income: {
          totalIncome: totalIncome,
          monthlySalary: 75000, // ₹75,000
          otherIncome: totalIncome - 75000,
        },
        expenses: {
          totalExpenses: totalExpenses,
          categories: {
            Food: 15000, // ₹15,000
            Shopping: 20000, // ₹20,000
            Transport: 8000, // ₹8,000
            Entertainment: 5000, // ₹5,000
            Bills: 12000, // ₹12,000
            Investment: 40000, // ₹40,000
          },
        },
        recentTransactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
      },
    };
  } catch (error) {
    console.error('Error fetching account summary:', error);
    return {
      success: false,
      error: 'Failed to fetch account summary',
    };
  }
};

// Get all transactions with optional pagination
export const getRecentTransactions = async (userId, page = 1, limit = 20) => {
  try {
    const data = getLocalStorageData(userId);
    
    // Initialize transactions if empty
    if (!data.transactions || data.transactions.length === 0) {
      data.transactions = generateMockTransactions(30);
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

// Format currency in Indian Rupees
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

// Process card payment and transfer money
export const processCardPayment = async (userId, paymentData) => {
  try {
    // In a real application, you would:
    // 1. Call your backend API to create a payment intent
    // 2. Process the payment through Stripe
    // 3. Update the database with the transaction
    
    // For demo purposes, we'll simulate a successful payment
    await new Promise(resolve => setTimeout(resolve, 1000));

    const transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description: paymentData.description || 'Card Transfer',
      amount: parseFloat(paymentData.amount),
      type: 'expense',
      category: 'Transfer',
      status: 'completed',
      paymentMethod: 'card',
      recipient: paymentData.recipientEmail,
      cardDetails: {
        last4: paymentData.lastFour,
        brand: paymentData.brand
      }
    };

    // Update local storage
    const data = getLocalStorageData(userId);
    data.transactions = data.transactions || [];
    data.transactions.push(transaction);
    saveLocalStorageData(userId, data);

    // Trigger data update event
    window.dispatchEvent(new CustomEvent('bankDataUpdated', { 
      detail: { userId, transactionType: 'card_payment' } 
    }));

    return {
      success: true,
      transaction
    };
  } catch (error) {
    console.error('Error processing card payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to process card payment'
    };
  }
};
