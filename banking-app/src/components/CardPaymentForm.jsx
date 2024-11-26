import React, { useState } from 'react';
import {
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { processCardPayment } from '../services/stripeService';
import { transferMoney } from '../services/bankingService';
import { useUser } from '@clerk/clerk-react';

const CardPaymentForm = ({ amount, recipientEmail, description, onSuccess, onError, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!recipientEmail) {
      setError('Please enter recipient email');
      return;
    }

    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError('Stripe has not been initialized');
      setLoading(false);
      return;
    }

    try {
      // For development, we'll skip actual card validation
      // In production, you would use stripe.createPaymentMethod()
      const mockPaymentMethodId = 'mock_pm_' + Math.random().toString(36).substring(7);

      // Process payment using our mock implementation
      const paymentResult = await processCardPayment(
        mockPaymentMethodId,
        amount,
        recipientEmail
      );

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
      }

      // Record the transfer in our system
      const transferResult = await transferMoney(user, {
        recipientEmail,
        amount,
        description: description || 'Card Payment Transfer',
        paymentMethodId: mockPaymentMethodId,
      });

      if (!transferResult.success) {
        throw new Error(transferResult.error || 'Transfer failed');
      }

      onSuccess?.(transferResult.data);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Card Details
        </Typography>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          Pay ${amount}
        </Button>
      </Box>
    </Box>
  );
};

export default CardPaymentForm;
