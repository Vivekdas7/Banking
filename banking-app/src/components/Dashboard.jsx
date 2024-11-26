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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useUser();

  const [accountData, setAccountData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use a default user ID if not available
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
        {/* Account Summary */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Account Summary
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setTransferDialogOpen(true)}
                startIcon={<SendIcon />}
              >
                Transfer Money
              </Button>
            </Box>

            {/* Account Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="div">
                        Balance
                      </Typography>
                    </Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(accountData?.balance || 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TrendingUpIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                      <Typography variant="h6" component="div">
                        Income
                      </Typography>
                    </Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                      {formatCurrency(accountData?.totalIncome || 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TrendingDownIcon sx={{ color: theme.palette.error.main, mr: 1 }} />
                      <Typography variant="h6" component="div">
                        Expenses
                      </Typography>
                    </Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                      {formatCurrency(accountData?.totalExpenses || 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="div">
                        Monthly Spending
                      </Typography>
                    </Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(accountData?.monthlySpending || 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
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
                          label
                        >
                          {(analytics?.spendingByCategory || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
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
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="amount" name="Spending" fill={theme.palette.primary.main} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Transfer Money Dialog */}
      <TransferMoney
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        onTransferComplete={loadDashboardData}
      />
    </Container>
  );
}

export default Dashboard;
