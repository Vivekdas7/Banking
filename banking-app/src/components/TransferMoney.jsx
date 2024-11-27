import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useUser } from '@clerk/clerk-react';
import { processCardPayment } from '../services/bankingService';

// Initialize Stripe with the publishable key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Stripe Card Element styles
const cardElementStyle = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      padding: '10px 0',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: true,
};

function TransferForm({ onClose, onTransferComplete }) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useUser();

  const [amount, setAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transferMethod, setTransferMethod] = useState('card');

  const validateForm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Please enter a valid amount');
    }
    if (!recipientEmail) {
      throw new Error('Please enter recipient email');
    }
    if (transferMethod === 'card' && !stripe) {
      throw new Error('Stripe is not initialized');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      validateForm();

      if (transferMethod === 'card') {
        const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: elements.getElement(CardElement),
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }

        const result = await processCardPayment(user?.id || 'default-user', {
          amount,
          recipientEmail,
          description,
          lastFour: paymentMethod.card.last4,
          brand: paymentMethod.card.brand,
        });

        if (!result.success) {
          throw new Error(result.error || 'Payment failed');
        }

        onTransferComplete();
        onClose();
      }
    } catch (err) {
      setError(err.message);
      console.error('Transfer error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          sx={{ mb: 2 }}
          inputProps={{ min: 0, step: "0.01" }}
          InputProps={{
            startAdornment: (
              <Typography variant="body1" sx={{ mr: 1 }}>
                $
              </Typography>
            ),
          }}
        />
        <TextField
          fullWidth
          label="Recipient Email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          required
          sx={{ mb: 2 }}
          type="email"
        />
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 2 }}
          multiline
          rows={2}
          placeholder="What's this transfer for?"
        />

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Transfer Method</InputLabel>
          <Select
            value={transferMethod}
            onChange={(e) => setTransferMethod(e.target.value)}
            label="Transfer Method"
          >
            <MenuItem value="card">Credit/Debit Card</MenuItem>
            <MenuItem value="bank">Bank Account (Coming Soon)</MenuItem>
          </Select>
        </FormControl>

        {transferMethod === 'card' && (
          <>
            <Divider sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Card Details
              </Typography>
            </Divider>
            <Box 
              sx={{ 
                mb: 3,
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                '&:hover': {
                  borderColor: 'primary.main',
                },
              }}
            >
              <CardElement options={cardElementStyle} />
            </Box>
          </>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !stripe}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Processing...' : 'Transfer Money'}
        </Button>
      </DialogActions>
    </form>
  );
}

export default function TransferMoney({ open, onClose, onTransferComplete }) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1,
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'medium' }}>
          Transfer Money
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Elements stripe={stripePromise}>
          <TransferForm onClose={onClose} onTransferComplete={onTransferComplete} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
