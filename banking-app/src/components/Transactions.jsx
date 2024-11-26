import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useUser } from '@clerk/clerk-react';
import { getRecentTransactions, addTransaction } from '../services/bankingService';
import {
  FilterList as FilterIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';

function Transactions() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useUser();

  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New transaction form state
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'debit',
    category: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getRecentTransactions(user);
      if (result.success) {
        setTransactions(result.transactions);
      } else {
        throw new Error(result.error || 'Failed to load transactions');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    setIsSubmitting(true);
    try {
      const result = await addTransaction(user, newTransaction);
      if (result.success) {
        setTransactions([result.transaction, ...transactions]);
        setOpenTransactionDialog(false);
        setNewTransaction({
          description: '',
          amount: '',
          type: 'debit',
          category: '',
        });
      } else {
        throw new Error(result.error || 'Failed to add transaction');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error adding transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getFilteredAndSortedTransactions = () => {
    return transactions
      .filter(transaction => {
        // Filter by type
        if (filterType !== 'all' && transaction.type !== filterType) {
          return false;
        }
        // Filter by search term
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          return (
            transaction.description.toLowerCase().includes(searchLower) ||
            transaction.category.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  const filteredTransactions = getFilteredAndSortedTransactions();

  return (
    <Container maxWidth="xl">
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: theme.palette.primary.main
            }}
          >
            Transactions
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenTransactionDialog(true)}
            size={isMobile ? "small" : "medium"}
          >
            New Transaction
          </Button>
        </Box>

        <Card sx={{ mb: { xs: 2, sm: 3 } }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" />,
                  }}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                  <InputLabel>Filter</InputLabel>
                  <Select
                    value={filterType}
                    label="Filter"
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="credit">Credit</MenuItem>
                    <MenuItem value="debit">Debit</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                  <InputLabel>Sort</InputLabel>
                  <Select
                    value={sortOrder}
                    label="Sort"
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <MenuItem value="desc">Newest First</MenuItem>
                    <MenuItem value="asc">Oldest First</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent>
              <Typography align="center" color="textSecondary">
                No transactions found
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {filteredTransactions.map((transaction) => (
              <Grid item xs={12} key={transaction.id}>
                <Card>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6" component="div">
                          {transaction.description}
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                          {new Date(transaction.date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ textAlign: { sm: 'right' } }}>
                        <Typography
                          variant="h6"
                          component="div"
                          color={transaction.type === 'credit' ? 'success.main' : 'error.main'}
                        >
                          {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </Typography>
                        <Chip
                          label={transaction.category}
                          size="small"
                          color={transaction.type === 'credit' ? 'success' : 'error'}
                          sx={{ mt: 1 }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* New Transaction Dialog */}
        <Dialog 
          open={openTransactionDialog} 
          onClose={() => setOpenTransactionDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>New Transaction</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={newTransaction.description}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Amount"
                    name="amount"
                    type="number"
                    value={newTransaction.amount}
                    onChange={handleInputChange}
                    required
                    inputProps={{ min: 0, step: "0.01" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      name="type"
                      value={newTransaction.type}
                      label="Type"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="debit">Debit</MenuItem>
                      <MenuItem value="credit">Credit</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Category"
                    name="category"
                    value={newTransaction.category}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenTransactionDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddTransaction}
              variant="contained"
              disabled={isSubmitting || !newTransaction.description || !newTransaction.amount || !newTransaction.category}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Add Transaction'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

export default Transactions;
