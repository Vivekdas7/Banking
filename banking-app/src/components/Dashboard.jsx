import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Savings,
  MoreVert,
} from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

function Dashboard() {
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(5000); // Mock data
  const [transactions] = useState([
    { type: 'credit', amount: 1000, description: 'Salary', date: '2024-01-15' },
    { type: 'debit', amount: 50, description: 'Grocery', date: '2024-01-14' },
    { type: 'debit', amount: 30, description: 'Coffee', date: '2024-01-13' },
  ]);

  const transactionData = [
    { month: 'Jan', income: 5000, expenses: 3500, balance: 1500 },
    { month: 'Feb', income: 6000, expenses: 4000, balance: 2000 },
    { month: 'Mar', income: 4500, expenses: 3000, balance: 1500 },
    { month: 'Apr', income: 7000, expenses: 4500, balance: 2500 },
    { month: 'May', income: 6500, expenses: 4200, balance: 2300 },
    { month: 'Jun', income: 5500, expenses: 3800, balance: 1700 },
  ];

  const spendingData = [
    { name: 'Groceries', value: 1200, color: '#8884d8' },
    { name: 'Utilities', value: 800, color: '#82ca9d' },
    { name: 'Entertainment', value: 600, color: '#ffc658' },
    { name: 'Transportation', value: 400, color: '#ff8042' },
    { name: 'Shopping', value: 900, color: '#a4de6c' },
  ];

  const dailyTransactions = [
    { day: 'Mon', amount: 120 },
    { day: 'Tue', amount: 280 },
    { day: 'Wed', amount: 150 },
    { day: 'Thu', amount: 300 },
    { day: 'Fri', amount: 270 },
    { day: 'Sat', amount: 500 },
    { day: 'Sun', amount: 190 },
  ];

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Welcome Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 2, sm: 3, md: 4 },
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
        }}
      >
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            mb: { xs: 1, sm: 2 }
          }}
        >
          Welcome Back{user?.firstName ? `, ${user.firstName}` : ''}!
        </Typography>
        <Typography 
          variant="subtitle1"
          sx={{ 
            opacity: 0.9,
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
          }}
        >
          Here's your financial overview
        </Typography>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        {/* Balance Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              borderRadius: 2,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalance sx={{ color: 'primary.main' }} />
              <Typography variant="h6" color="primary">
                Balance
              </Typography>
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
              }}
            >
              ${balance.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Available Balance
            </Typography>
          </Paper>
        </Grid>

        {/* Income Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              borderRadius: 2,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp sx={{ color: 'success.main' }} />
              <Typography variant="h6" color="success.main">
                Income
              </Typography>
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
              }}
            >
              ${transactions.reduce((acc, t) => acc + (t.type === 'credit' ? t.amount : 0), 0).toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This Month
            </Typography>
          </Paper>
        </Grid>

        {/* Expenses Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              borderRadius: 2,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingDown sx={{ color: 'error.main' }} />
              <Typography variant="h6" color="error.main">
                Expenses
              </Typography>
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
              }}
            >
              ${transactions.reduce((acc, t) => acc + (t.type === 'debit' ? t.amount : 0), 0).toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This Month
            </Typography>
          </Paper>
        </Grid>

        {/* Savings Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              borderRadius: 2,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Savings sx={{ color: 'info.main' }} />
              <Typography variant="h6" color="info.main">
                Savings
              </Typography>
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
              }}
            >
              ${(balance * 0.4).toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Savings
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Income vs Expenses Area Chart */}
        <Grid item xs={12} lg={8}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                  Income vs Expenses
                </Typography>
                <IconButton onClick={handleClick}>
                  <MoreVert />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleClose}>Last 6 Months</MenuItem>
                  <MenuItem onClick={handleClose}>Last Year</MenuItem>
                  <MenuItem onClick={handleClose}>All Time</MenuItem>
                </Menu>
              </Box>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart
                    data={transactionData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff8042" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ff8042" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#82ca9d"
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ff8042"
                      fillOpacity={1}
                      fill="url(#colorExpenses)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Spending Categories Pie Chart */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Spending Categories
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name} (${formatCurrency(value)})`}
                    >
                      {spendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Daily Transactions Bar Chart */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Daily Transactions
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={dailyTransactions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar
                      dataKey="amount"
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Transactions */}
      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          mt: { xs: 2, sm: 3, md: 4 },
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Recent Transactions
        </Typography>
        {transactions.length > 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: { xs: 1, sm: 2 } 
          }}>
            {transactions.map((transaction, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: { xs: 1, sm: 2 },
                  borderRadius: 1,
                  bgcolor: theme.palette.grey[50],
                  '&:hover': {
                    bgcolor: theme.palette.grey[100],
                  },
                }}
              >
                <Box>
                  <Typography variant={isMobile ? 'body2' : 'body1'} sx={{ fontWeight: 500 }}>
                    {transaction.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(transaction.date).toLocaleDateString()}
                  </Typography>
                </Box>
                <Typography
                  variant={isMobile ? 'body2' : 'body1'}
                  sx={{
                    color: transaction.type === 'credit' 
                      ? theme.palette.success.main 
                      : theme.palette.error.main,
                    fontWeight: 500,
                  }}
                >
                  {transaction.type === 'credit' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">No recent transactions</Typography>
        )}
      </Paper>
    </Box>
  );
}

export default Dashboard;
