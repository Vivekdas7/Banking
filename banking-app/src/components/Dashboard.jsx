import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Paper,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Tooltip,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Send as SendIcon,
  CreditCard as CreditCardIcon,
  Subscriptions as SubscriptionsIcon,
  Payment as PaymentIcon,
  MonetizationOn as MonetizationOnIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';
import { getAccountSummary, getSpendingAnalytics, formatCurrency } from '../services/bankingService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as TooltipChart, Legend } from 'recharts';
import TransferMoney from './TransferMoney';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Quick actions for SpeedDial
const actions = [
  { icon: <SendIcon />, name: 'Send Money', action: 'transfer' },
  { icon: <CreditCardIcon />, name: 'Card Payment', action: 'card' },
  { icon: <SubscriptionsIcon />, name: 'Subscriptions', action: 'subscription' },
];

function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useUser();

  const [accountData, setAccountData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = user?.id || 'default-user';
      
      const [summaryResult, analyticsResult] = await Promise.all([
        getAccountSummary(userId),
        getSpendingAnalytics(userId)
      ]);

      if (summaryResult.success && analyticsResult.success) {
        setAccountData(summaryResult.data);
        setAnalytics(analyticsResult.data);
      } else {
        throw new Error(summaryResult.error || analyticsResult.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Listen for data updates
  useEffect(() => {
    const handleDataUpdate = (event) => {
      if (event.detail.userId === user?.id) {
        loadDashboardData();
      }
    };

    window.addEventListener('bankDataUpdated', handleDataUpdate);
    return () => {
      window.removeEventListener('bankDataUpdated', handleDataUpdate);
    };
  }, [user]);

  const handleTransferComplete = () => {
    setTransferDialogOpen(false);
    loadDashboardData(); // Refresh data after transfer
  };

  const handleSpeedDialAction = (action) => {
    setSelectedAction(action);
    if (action === 'transfer' || action === 'card') {
      setTransferDialogOpen(true);
    }
    // Handle subscription action here
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Quick Action Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
            onClick={() => setTransferDialogOpen(true)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SendIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6" component="div">
                    Send Money
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Transfer to anyone, anywhere
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
            onClick={() => handleSpeedDialAction('card')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CreditCardIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6" component="div">
                    Card Payment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pay with credit/debit card
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
            onClick={() => handleSpeedDialAction('subscription')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SubscriptionsIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6" component="div">
                    Subscriptions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage your subscriptions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MonetizationOnIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6" component="div">
                    Quick Pay
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pay bills & utilities
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Balance Summary */}
      <Grid item xs={12} md={4}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Balance</Typography>
            </Box>
            <Typography variant="h4" component="div">
              {formatCurrency(accountData?.balance?.currentBalance || 0)}
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 1 }}>
              Available: {formatCurrency(accountData?.balance?.availableBalance || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending: {formatCurrency(accountData?.balance?.pendingTransactions || 0)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Income Summary */}
      <Grid item xs={12} md={4}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Income</Typography>
            </Box>
            <Typography variant="h4" component="div">
              {formatCurrency(accountData?.income?.totalIncome || 0)}
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 1 }}>
              Monthly Salary: {formatCurrency(accountData?.income?.monthlySalary || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Other Income: {formatCurrency(accountData?.income?.otherIncome || 0)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Expenses Summary */}
      <Grid item xs={12} md={4}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingDownIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">Expenses</Typography>
            </Box>
            <Typography variant="h4" component="div">
              {formatCurrency(accountData?.expenses?.totalExpenses || 0)}
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 1 }}>
              Monthly Average: {formatCurrency((accountData?.expenses?.totalExpenses || 0) / 12)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Categories: {Object.keys(accountData?.expenses?.categories || {}).length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Transactions */}
      <Grid item xs={12}>
        <Paper elevation={2} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Recent Transactions
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AssessmentIcon />}
              onClick={() => navigate('/transactions')}
            >
              View All
            </Button>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accountData?.recentTransactions?.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell align="right" sx={{ 
                      color: transaction.type === 'expense' ? 'error.main' : 'success.main' 
                    }}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small"
                        label={transaction.status}
                        color={transaction.status === 'completed' ? 'success' : 'warning'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Grid>

      {/* Spending by Category Pie Chart */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Spending by Category
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.spendingByCategory || []}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {(analytics?.spendingByCategory || []).map((entry, index) => (
                    <Cell 
                      key={`cell-${entry.category}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <TooltipChart 
                  formatter={(value) => formatCurrency(value)} 
                  labelFormatter={(label) => `Category: ${label}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Monthly Spending Trend */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Monthly Spending Trend
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.monthOverMonth || []}>
                <XAxis dataKey="month" />
                <YAxis />
                <TooltipChart formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="amount" name="Spending" fill={theme.palette.primary.main} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Mobile SpeedDial for quick actions */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon openIcon={<AddIcon />} />}
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => handleSpeedDialAction(action.action)}
            />
          ))}
        </SpeedDial>
      )}

      {/* Transfer Money Dialog */}
      <TransferMoney
        open={transferDialogOpen}
        onClose={() => {
          setTransferDialogOpen(false);
          setSelectedAction(null);
        }}
        onTransferComplete={() => {
          loadDashboardData();
          setTransferDialogOpen(false);
          setSelectedAction(null);
        }}
        initialMethod={selectedAction === 'card' ? 'card' : 'bank'}
      />
    </Container>
  );
}

export default Dashboard;
