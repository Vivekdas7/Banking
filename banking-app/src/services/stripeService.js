// Mock implementation for development
const mockApiCall = (data, delay = 1000) => 
  new Promise((resolve) => {
    setTimeout(() => resolve({ success: true, data }), delay);
  });

// Create a payment intent
export const createPaymentIntent = async (amount, currency = 'usd') => {
  try {
    // In a real implementation, this would call your backend API
    const response = await mockApiCall({
      clientSecret: 'mock_client_secret_' + Math.random().toString(36).substring(7),
    });

    return {
      success: true,
      clientSecret: response.data.clientSecret,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Process card payment
export const processCardPayment = async (paymentMethodId, amount, recipientEmail) => {
  try {
    // In a real implementation, this would call your backend API
    const response = await mockApiCall({
      id: 'mock_payment_' + Math.random().toString(36).substring(7),
      amount,
      recipientEmail,
      status: 'succeeded',
      created: new Date().toISOString(),
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
