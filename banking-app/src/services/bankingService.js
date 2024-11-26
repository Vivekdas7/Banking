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

export const getRecentTransactions = async (user) => {
  if (!user) {
    console.error('No user provided to getRecentTransactions');
    return {
      success: false,
      error: 'User not found'
    };
  }

  try {
    const bankData = await getMetadata(user);
    const transactions = bankData.transactions || [];
    
    // Sort transactions by date in descending order
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    return {
      success: true,
      transactions: sortedTransactions
    };
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    return {
      success: false,
      error: 'Failed to get recent transactions'
    };
  }
};

export const addTransaction = async (user, transactionData) => {
  try {
    const metadata = await getMetadata(user);
    const transactions = metadata.transactions || [];

    // Add new transaction
    const newTransaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...transactionData
    };

    transactions.push(newTransaction);
    
    // Update metadata
    const success = await updateMetadata(user, {
      ...metadata,
      transactions
    });

    if (success) {
      return {
        success: true,
        transaction: newTransaction
      };
    } else {
      throw new Error('Failed to update metadata');
    }
  } catch (error) {
    console.error('Error adding transaction:', error);
    return {
      success: false,
      error: 'Failed to add transaction'
    };
  }
};

// Add some mock transactions if none exist
export const initializeDefaultTransactions = async (user) => {
  if (!user) {
    console.error('No user provided to initializeDefaultTransactions');
    return {
      success: false,
      error: 'User not found'
    };
  }

  try {
    const bankData = await getMetadata(user);
    
    // Only initialize if no transactions exist
    if (bankData.transactions && bankData.transactions.length > 0) {
      return { success: true };
    }

    const currentDate = new Date();
    const defaultTransactions = [
      {
        id: '1',
        type: 'credit',
        amount: 3000,
        description: 'Salary Deposit',
        category: 'Income',
        date: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        type: 'debit',
        amount: 800,
        description: 'Rent Payment',
        category: 'Housing',
        date: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        type: 'debit',
        amount: 100,
        description: 'Grocery Shopping',
        category: 'Food',
        date: new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        type: 'debit',
        amount: 50,
        description: 'Internet Bill',
        category: 'Utilities',
        date: new Date(currentDate.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '5',
        type: 'credit',
        amount: 500,
        description: 'Freelance Payment',
        category: 'Income',
        date: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    bankData.transactions = defaultTransactions;
    await updateMetadata(user, bankData);
    
    return { success: true };
  } catch (error) {
    console.error('Error initializing default transactions:', error);
    return {
      success: false,
      error: 'Failed to initialize default transactions'
    };
  }
};
