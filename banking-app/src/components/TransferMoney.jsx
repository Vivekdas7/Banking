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
  CircularProgress,
  Tabs,
  Tab,
  Snackbar,
} from '@mui/material';
import { useUser } from '@clerk/clerk-react';
import { transferMoney } from '../services/bankingService';
import CardPaymentForm from './CardPaymentForm';

const TransferMoney = ({ open, onClose, onTransferComplete }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    recipientEmail: '',
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleTabChange = (event, newValue) => {
    if (!formData.recipientEmail || !formData.amount) {
      setError('Please fill in recipient email and amount before switching payment methods');
      return;
    }
    setActiveTab(newValue);
    setError(null);
  };

  const validateForm = () => {
    if (!formData.recipientEmail) {
      throw new Error('Please enter recipient email');
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Please enter a valid amount');
    }
    return amount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const amount = validateForm();

      const result = await transferMoney(user, {
        recipientEmail: formData.recipientEmail,
        amount,
        description: formData.description
      });

      if (result.success) {
        setSuccessMessage(`Successfully sent $${amount} to ${formData.recipientEmail}`);
        onTransferComplete();
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(result.error || 'Transfer failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPaymentSuccess = (data) => {
    const amount = parseFloat(formData.amount);
    setSuccessMessage(`Successfully sent $${amount} to ${formData.recipientEmail}`);
    onTransferComplete();
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleCardPaymentError = (error) => {
    setError(error.message);
  };

  const handleSnackbarClose = () => {
    setSuccessMessage('');
  };

  const renderTransferForm = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
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
        InputProps={{
          startAdornment: (
            <Typography variant="body1" sx={{ mr: 1 }}>
              $
            </Typography>
          ),
        }}
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
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Money</DialogTitle>
        <DialogContent>
          {renderTransferForm()}
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3, borderTop: 1, borderColor: 'divider', pt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Payment Method
            </Typography>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{ mb: 2 }}
            >
              <Tab label="Bank Transfer" />
              <Tab label="Card Payment" />
            </Tabs>

            {activeTab === 0 ? (
              <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Transfer'}
                </Button>
              </DialogActions>
            ) : (
              <CardPaymentForm
                amount={parseFloat(formData.amount) || 0}
                recipientEmail={formData.recipientEmail}
                description={formData.description}
                onSuccess={handleCardPaymentSuccess}
                onError={handleCardPaymentError}
                onCancel={onClose}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        message={successMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        ContentProps={{
          sx: {
            backgroundColor: 'success.main',
            color: 'white',
          }
        }}
      />
    </>
  );
};

export default TransferMoney;
