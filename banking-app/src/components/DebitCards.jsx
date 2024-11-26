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
  CircularProgress,
  Snackbar,
  useTheme,
  useMediaQuery,
  InputAdornment,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Add,
  CreditCard,
  Payment,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import {
  addDebitCard,
  getDebitCards,
  processCardPayment,
  formatCardNumber,
  getCardType,
} from '../services/cardService';

const DebitCards = () => {
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isLaptop = useMediaQuery(theme.breakpoints.up('lg'));
  
  const [cards, setCards] = useState([]);
  const [openAddCard, setOpenAddCard] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [showCVV, setShowCVV] = useState({});
  
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
  });

  const [paymentData, setPaymentData] = useState({
    cardId: '',
    amount: '',
    description: '',
  });

  useEffect(() => {
    loadCards();
  }, [user]);

  const loadCards = async () => {
    if (user) {
      setLoading(true);
      const result = await getDebitCards(user);
      if (result.success) {
        setCards(result.cards);
      }
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    setLoading(true);
    const cardData = {
      ...newCard,
    };

    const result = await addDebitCard(user, cardData);
    setLoading(false);

    if (result.success) {
      setNotification({
        open: true,
        message: 'Debit card added successfully',
        severity: 'success',
      });
      loadCards();
      setOpenAddCard(false);
      setNewCard({
        cardNumber: '',
        cardholderName: '',
        expiryDate: '',
        cvv: '',
      });
    } else {
      setNotification({
        open: true,
        message: result.error,
        severity: 'error',
      });
    }
  };

  const handlePayment = async () => {
    if (!paymentData.cardId || !paymentData.amount) {
      setNotification({
        open: true,
        message: 'Please fill all required fields',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    const result = await processCardPayment(
      user,
      paymentData.cardId,
      parseFloat(paymentData.amount),
      paymentData.description || 'Card payment'
    );
    setLoading(false);

    if (result.success) {
      setNotification({
        open: true,
        message: 'Payment processed successfully',
        severity: 'success',
      });
      loadCards();
      setOpenPayment(false);
      setPaymentData({
        cardId: '',
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

  const formatExpiryDate = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  return (
    <Box sx={{ width: '100%', p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ 
        mb: { xs: 2, sm: 3, md: 4 },
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography 
          variant="h4" 
          component="h1"
          color="primary"
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            fontWeight: 'bold'
          }}
        >
          Debit Cards
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Payment />}
            onClick={() => setOpenPayment(true)}
            size={isMobile ? "small" : "medium"}
          >
            Make Payment
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAddCard(true)}
            size={isMobile ? "small" : "medium"}
          >
            Add Card
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={card.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: theme.shadows[10],
                  },
                }}
              >
                <CardContent sx={{ height: '100%', p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    height: '100%',
                    gap: { xs: 1.5, sm: 2, md: 3 }
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          opacity: 0.9,
                          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                        }}
                      >
                        {getCardType(card.cardNumber)}
                      </Typography>
                      <CreditCard sx={{ fontSize: { xs: 24, sm: 28, md: 32 }, opacity: 0.8 }} />
                    </Box>
                    
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        letterSpacing: 2,
                        my: { xs: 1, sm: 2 },
                        fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                        textAlign: 'center'
                      }}
                    >
                      {formatCardNumber(card.cardNumber)}
                    </Typography>

                    <Box sx={{ mt: 'auto' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={8}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              opacity: 0.8,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            Card Holder
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 500,
                              fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}
                          >
                            {card.cardholderName}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              opacity: 0.8,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            Expires
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 500,
                              fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}
                          >
                            {card.expiryDate}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {cards.length === 0 && !loading && (
            <Grid item xs={12}>
              <Paper 
                sx={{ 
                  p: { xs: 2, sm: 3, md: 4 },
                  textAlign: 'center',
                  bgcolor: 'background.default'
                }}
              >
                <Typography color="textSecondary">
                  No debit cards found. Add your first card to get started!
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Add Card Dialog */}
      <Dialog 
        open={openAddCard} 
        onClose={() => setOpenAddCard(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Debit Card</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Card Number"
                value={newCard.cardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                  setNewCard({ ...newCard, cardNumber: value });
                }}
                inputProps={{ maxLength: 16 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cardholder Name"
                value={newCard.cardholderName}
                onChange={(e) => setNewCard({ ...newCard, cardholderName: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Expiry Date (MM/YY)"
                value={newCard.expiryDate}
                onChange={(e) => {
                  const formatted = formatExpiryDate(e.target.value);
                  setNewCard({ ...newCard, expiryDate: formatted });
                }}
                inputProps={{ maxLength: 5 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="CVV"
                type={showCVV ? 'text' : 'password'}
                value={newCard.cvv}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                  setNewCard({ ...newCard, cvv: value });
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCVV(!showCVV)}
                        edge="end"
                      >
                        {showCVV ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                inputProps={{ maxLength: 3 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddCard(false)}>Cancel</Button>
          <Button 
            onClick={handleAddCard} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Card'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Make Payment Dialog */}
      <Dialog 
        open={openPayment} 
        onClose={() => setOpenPayment(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Make Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Select Card"
                value={paymentData.cardId}
                onChange={(e) => setPaymentData({ ...paymentData, cardId: e.target.value })}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">Select a card</option>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {getCardType(card.cardNumber)} - {formatCardNumber(card.cardNumber)}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Amount"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={paymentData.description}
                onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPayment(false)}>Cancel</Button>
          <Button 
            onClick={handlePayment} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Make Payment'}
          </Button>
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
    </Box>
  );
};

export default DebitCards;
