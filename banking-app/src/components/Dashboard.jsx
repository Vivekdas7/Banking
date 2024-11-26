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
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';
import { getAccountSummary, getSpendingAnalytics, formatCurrency } from '../services/bankingService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import TransferMoney from './TransferMoney';

// Enhanced color palette for the pie chart
const COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Mint
  '#FFEEAD', // Yellow
  '#D4A5A5', // Pink
  '#9FA8DA', // Purple
  '#80DEEA', // Cyan
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
      <Grid container spacing={3}>
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
              <Typography variant="body2" color="textSecondary">
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
              <Typography variant="body2" color="textSecondary">
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
              <Typography variant="body2" color="textSecondary">
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
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3,
              background: 'linear-gradient(to bottom right, #ffffff, #f8f9fa)',
              borderRadius: 2,
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
              }
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                fontWeight: 600,
                color: theme.palette.primary.main,
                textAlign: 'center'
              }}
            >
              Spending by Category
            </Typography>
            <Box sx={{ 
              height: 350,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.spendingByCategory || []}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={2}
                    label={({ name, percent }) => 
                      `${name} (${(percent * 100).toFixed(1)}%)`
                    }
                    labelLine={{ stroke: theme.palette.text.primary, strokeWidth: 1 }}
                  >
                    {(analytics?.spendingByCategory || []).map((entry, index) => (
                      <Cell 
                        key={`cell-${entry.category}`} 
                        fill={COLORS[index % COLORS.length]}
                        stroke={theme.palette.background.paper}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <Box
                            sx={{
                              background: theme.palette.background.paper,
                              p: 1.5,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 1,
                              boxShadow: theme.shadows[3],
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ color: theme.palette.text.primary, mb: 0.5 }}
                            >
                              {data.category}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: theme.palette.text.secondary }}
                            >
                              Amount: {formatCurrency(data.amount)}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: theme.palette.text.secondary }}
                            >
                              Percentage: {((data.amount / analytics.spendingByCategory.reduce((sum, cat) => sum + cat.amount, 0)) * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: theme.palette.text.primary, fontSize: '0.875rem' }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                sx={{ mt: 2, textAlign: 'center' }}
              >
                Total Spending: {formatCurrency(
                  (analytics?.spendingByCategory || []).reduce(
                    (sum, category) => sum + category.amount, 
                    0
                  )
                )}
              </Typography>
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
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="amount" name="Spending" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Transfer Money Dialog */}
      <TransferMoney
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        onTransferComplete={handleTransferComplete}
      />
    </Container>
  );
}

export default Dashboard;
