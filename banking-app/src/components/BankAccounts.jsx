import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Box,
  IconButton,
  Paper,
  Snackbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
  AccountBalance,
  Send,
  Close,
} from '@mui/icons-material';
import {
  addBankAccount,
  getBankAccounts,
  transferMoney,
} from '../services/bankingService';

const BankAccounts = () => {
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [accounts, setAccounts] = useState([]);
  const [openAddAccount, setOpenAddAccount] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  const [newAccount, setNewAccount] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    balance: 0,
  });

  const [transferData, setTransferData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    description: '',
  });

  useEffect(() => {
    loadAccounts();
  }, [user]);

  const loadAccounts = async () => {
    if (user) {
      const result = await getBankAccounts(user);
      if (result.success) {
        setAccounts(result.accounts);
      }
    }
  };

  const handleAddAccount = async () => {
    const accountData = {
      ...newAccount,
      balance: parseFloat(newAccount.balance),
    };

    const result = await addBankAccount(user, accountData);
    if (result.success) {
      setNotification({
        open: true,
        message: 'Bank account added successfully',
        severity: 'success',
      });
      loadAccounts();
      setOpenAddAccount(false);
      setNewAccount({
        accountName: '',
        accountNumber: '',
        bankName: '',
        ifscCode: '',
        balance: 0,
      });
    } else {
      setNotification({
        open: true,
        message: result.error,
        severity: 'error',
      });
    }
  };

  const handleTransfer = async () => {
    if (!transferData.fromAccount || !transferData.toAccount || !transferData.amount) {
      setNotification({
        open: true,
        message: 'Please fill all required fields',
        severity: 'error',
      });
      return;
    }

    const amount = parseFloat(transferData.amount);
    if (isNaN(amount) || amount <= 0) {
      setNotification({
        open: true,
        message: 'Please enter a valid amount',
        severity: 'error',
      });
      return;
    }

    const result = await transferMoney(
      user,
      transferData.fromAccount,
      transferData.toAccount,
      amount,
      transferData.description
    );

    if (result.success) {
      setNotification({
        open: true,
        message: 'Transfer completed successfully',
        severity: 'success',
      });
      loadAccounts();
      setOpenTransfer(false);
      setTransferData({
        fromAccount: '',
        toAccount: '',
        amount: '',
        description: '',
      });
    } else {
      setNotification({
        open: true,
        message: result.error,
        severity: 'error',
      });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
      {/* Header */}
      <Box sx={{ 
        mb: { xs: 2, sm: 4 },
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography 
          variant="h4" 
          color="primary"
          sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
        >
          Bank Accounts
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Send />}
            onClick={() => setOpenTransfer(true)}
            size={isMobile ? "small" : "medium"}
          >
            Transfer Money
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAddAccount(true)}
            size={isMobile ? "small" : "medium"}
          >
            Add Account
          </Button>
        </Box>
      </Box>

      {/* Accounts Grid */}
      <Grid container spacing={3}>
        {accounts.map((account) => (
          <Grid item xs={12} md={6} key={account.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccountBalance sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6">{account.bankName}</Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Account Name: {account.accountName}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Account Number: {account.accountNumber}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  IFSC Code: {account.ifscCode}
                </Typography>
                <Typography 
                  variant="h6" 
                  color="primary"
                  sx={{ mt: 2 }}
                >
                  Balance: ${account.balance.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add Account Dialog */}
      <Dialog 
        open={openAddAccount} 
        onClose={() => setOpenAddAccount(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Bank Account</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Name"
                value={newAccount.accountName}
                onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Number"
                value={newAccount.accountNumber}
                onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bank Name"
                value={newAccount.bankName}
                onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="IFSC Code"
                value={newAccount.ifscCode}
                onChange={(e) => setNewAccount({ ...newAccount, ifscCode: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Initial Balance"
                value={newAccount.balance}
                onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddAccount(false)}>Cancel</Button>
          <Button onClick={handleAddAccount} variant="contained">Add Account</Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Money Dialog */}
      <Dialog 
        open={openTransfer} 
        onClose={() => setOpenTransfer(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Transfer Money</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="From Account"
                value={transferData.fromAccount}
                onChange={(e) => setTransferData({ ...transferData, fromAccount: e.target.value })}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bankName} - {account.accountNumber}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="To Account"
                value={transferData.toAccount}
                onChange={(e) => setTransferData({ ...transferData, toAccount: e.target.value })}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">Select account</option>
                {accounts
                  .filter(account => account.id !== transferData.fromAccount)
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber}
                    </option>
                  ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Amount"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={transferData.description}
                onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTransfer(false)}>Cancel</Button>
          <Button onClick={handleTransfer} variant="contained">Transfer</Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BankAccounts;
