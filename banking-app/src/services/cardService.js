// Card service using Clerk's user metadata
const defaultCardData = {
  cards: [],
  transactions: [],
};

// Helper function to get metadata or initialize if not exists
const getMetadata = async (user) => {
  try {
    const metadata = await user.getOrganizationMembershipPublicMetadata();
    return metadata || { cards: [], cardTransactions: [] };
  } catch (error) {
    console.error('Error getting metadata:', error);
    return { cards: [], cardTransactions: [] };
  }
};

// Helper function to update metadata
const updateMetadata = async (user, newMetadata) => {
  try {
    await user.updateOrganizationMembershipPublicMetadata(newMetadata);
    return true;
  } catch (error) {
    console.error('Error updating metadata:', error);
    return false;
  }
};

// Get card data from user metadata
const getCardData = async (user) => {
  try {
    const metadata = await getMetadata(user);
    return metadata;
  } catch (error) {
    console.error('Error getting card data:', error);
    return defaultCardData;
  }
};

// Save card data to user metadata
const saveCardData = async (user, data) => {
  try {
    await updateMetadata(user, data);
  } catch (error) {
    console.error('Error saving card data:', error);
    throw error;
  }
};

// Validate card number using Luhn algorithm
const isValidCardNumber = (cardNumber) => {
  const digits = cardNumber.replace(/\D/g, '');
  
  let sum = 0;
  let isEven = false;
  
  // Loop through values starting from the rightmost digit
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Add new debit card
export const addDebitCard = async (user, cardData) => {
  try {
    const metadata = await getMetadata(user);
    const cards = metadata.cards || [];

    // Validate card number using Luhn algorithm
    if (!isValidCardNumber(cardData.cardNumber)) {
      return {
        success: false,
        error: 'Invalid card number'
      };
    }

    // Add new card
    const newCard = {
      id: Date.now().toString(),
      lastFourDigits: cardData.cardNumber.slice(-4),
      ...cardData
    };

    // Remove full card number for security
    delete newCard.cardNumber;

    cards.push(newCard);
    
    // Update metadata
    const success = await updateMetadata(user, {
      ...metadata,
      cards
    });

    if (success) {
      return {
        success: true,
        card: newCard
      };
    } else {
      throw new Error('Failed to update metadata');
    }
  } catch (error) {
    console.error('Error adding debit card:', error);
    return {
      success: false,
      error: 'Failed to add debit card'
    };
  }
};

// Get user's debit cards
export const getDebitCards = async (user) => {
  try {
    const metadata = await getMetadata(user);
    return {
      success: true,
      cards: metadata.cards || []
    };
  } catch (error) {
    console.error('Error getting debit cards:', error);
    return {
      success: false,
      error: 'Failed to get debit cards'
    };
  }
};

// Process debit card payment
export const processCardPayment = async (user, cardId, amount, description) => {
  try {
    const metadata = await getMetadata(user);
    const cards = metadata.cards || [];
    const cardTransactions = metadata.cardTransactions || [];

    // Verify card exists
    const card = cards.find(c => c.id === cardId);
    if (!card) {
      return {
        success: false,
        error: 'Card not found'
      };
    }

    // Add new transaction
    const newTransaction = {
      id: Date.now().toString(),
      cardId,
      amount,
      description,
      date: new Date().toISOString(),
      status: 'completed'
    };

    cardTransactions.push(newTransaction);
    
    // Update metadata
    const success = await updateMetadata(user, {
      ...metadata,
      cardTransactions
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
    console.error('Error processing card payment:', error);
    return {
      success: false,
      error: 'Failed to process payment'
    };
  }
};

// Get card transactions
export const getCardTransactions = async (user, cardId) => {
  try {
    const metadata = await getMetadata(user);
    const transactions = metadata.cardTransactions || [];
    return {
      success: true,
      transactions: transactions.filter(t => t.cardId === cardId)
    };
  } catch (error) {
    console.error('Error getting card transactions:', error);
    return {
      success: false,
      error: 'Failed to get transactions'
    };
  }
};

// Initialize default cards if none exist
export const initializeDefaultCards = async (user) => {
  try {
    const metadata = await getMetadata(user);
    if (!metadata.cards || metadata.cards.length === 0) {
      const defaultCards = [
        {
          id: '1',
          type: 'Visa',
          lastFourDigits: '4242',
          expiryMonth: '12',
          expiryYear: '2025',
          cardholderName: 'John Doe'
        },
        {
          id: '2',
          type: 'Mastercard',
          lastFourDigits: '5555',
          expiryMonth: '10',
          expiryYear: '2024',
          cardholderName: 'John Doe'
        }
      ];

      await updateMetadata(user, {
        ...metadata,
        cards: defaultCards
      });

      return {
        success: true,
        cards: defaultCards
      };
    }
    return {
      success: true,
      cards: metadata.cards
    };
  } catch (error) {
    console.error('Error initializing default cards:', error);
    return {
      success: false,
      error: 'Failed to initialize default cards'
    };
  }
};

// Format card number (e.g., **** **** **** 1234)
export const formatCardNumber = (number) => {
  const last4 = number.slice(-4);
  return `**** **** **** ${last4}`;
};

// Get card type based on number
export const getCardType = (number) => {
  const firstDigit = number.charAt(0);
  switch (firstDigit) {
    case '4':
      return 'Visa';
    case '5':
      return 'MasterCard';
    case '3':
      return 'American Express';
    default:
      return 'Unknown';
  }
};
