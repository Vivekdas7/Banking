import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { useUser } from '@clerk/clerk-react';
import { transferMoney } from '../services/bankingService';

const TransferMoney = ({ open, onClose, onTransferComplete }) => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    recipientEmail: '',
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const result = await transferMoney({
        senderId: user?.id,
        recipientEmail: formData.recipientEmail,
        amount,
        description: formData.description
      });

      if (result.success) {
        onTransferComplete();
        onClose();
      } else {
        throw new Error(result.error || 'Transfer failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Transfer Money</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Recipient Email"
              name="recipientEmail"
              value={formData.recipientEmail}
              onChange={handleChange}
              required
              fullWidth
              type="email"
            />
            <TextField
              label="Amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              fullWidth
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              startAdornment={
                <Typography variant="body1" sx={{ mr: 1 }}>
                  $
                </Typography>
              }
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
              placeholder="What's this transfer for?"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Transfer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TransferMoney;
