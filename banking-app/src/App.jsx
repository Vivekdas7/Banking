import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SignIn, SignUp, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Box, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Drawer,
  useMediaQuery,
  Container,
} from '@mui/material';
import { Menu } from '@mui/icons-material';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Transactions from './components/Transactions';
import DebitCards from './components/DebitCards';
import SideNav from './components/SideNav';
import { useState } from 'react';

// Create theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          width: 280,
          backgroundColor: '#1976d2',
          color: '#fff',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          color: '#1976d2',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <SignedIn>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          {/* App Bar */}
          <AppBar
            position="fixed"
            sx={{
              width: { sm: `calc(100% - ${280}px)` },
              ml: { sm: `${280}px` },
              bgcolor: 'background.paper',
              zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <Menu />
              </IconButton>
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                Banking Dashboard
              </Typography>
              <UserButton afterSignOutUrl="/sign-in" />
            </Toolbar>
          </AppBar>

          {/* Side Navigation */}
          <Box
            component="nav"
            sx={{ width: { sm: 280 }, flexShrink: { sm: 0 } }}
          >
            {/* Mobile drawer */}
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{ keepMounted: true }}
              sx={{
                display: { xs: 'block', sm: 'none' },
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: 280,
                },
              }}
            >
              <Toolbar />
              <SideNav />
            </Drawer>
            
            {/* Desktop drawer */}
            <Drawer
              variant="permanent"
              sx={{
                display: { xs: 'none', sm: 'block' },
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: 280,
                },
              }}
              open
            >
              <Toolbar />
              <SideNav />
            </Drawer>
          </Box>

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { sm: `calc(100% - ${280}px)` },
              mt: { xs: 7, sm: 8 },
              bgcolor: 'background.default',
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/cards" element={<DebitCards />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </SignedIn>

      <SignedOut>
        <Box 
          sx={{ 
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            position: 'fixed',
            top: 0,
            left: 0,
            overflow: 'auto',
            padding: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Container 
            maxWidth="sm" 
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              my: { xs: 2, sm: 4 },
              mx: { xs: 2, sm: 'auto' },
              width: '100%',
            }}
          >
            <Box
              sx={{
                width: '100%',
                bgcolor: 'background.paper',
                borderRadius: { xs: 1, sm: 2 },
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                p: { xs: 2, sm: 3 },
              }}
            >
              <Routes>
                <Route
                  path="/sign-in"
                  element={
                    <SignIn 
                      routing="path" 
                      path="/sign-in" 
                      signUpUrl="/sign-up"
                      redirectUrl="/"
                      appearance={{
                        elements: {
                          rootBox: {
                            width: '100%',
                            margin: 0,
                            padding: 0,
                          },
                          card: {
                            border: 'none',
                            boxShadow: 'none',
                            width: '100%',
                            margin: 0,
                            padding: 0,
                          },
                          formButtonPrimary: {
                            backgroundColor: theme.palette.primary.main,
                            '&:hover': {
                              backgroundColor: theme.palette.primary.dark,
                            },
                            width: '100%',
                            marginTop: '1rem',
                          },
                          formFieldInput: {
                            padding: '0.75rem',
                            fontSize: '1rem',
                            borderRadius: '0.5rem',
                            '@media (max-width: 600px)': {
                              padding: '0.5rem',
                              fontSize: '0.875rem',
                            },
                          },
                          footerActionLink: {
                            color: theme.palette.primary.main,
                            '&:hover': {
                              color: theme.palette.primary.dark,
                            },
                          },
                          header: {
                            '@media (max-width: 600px)': {
                              fontSize: '1.25rem',
                            },
                          },
                        },
                      }}
                    />
                  }
                />
                <Route
                  path="/sign-up"
                  element={
                    <SignUp 
                      routing="path" 
                      path="/sign-up" 
                      signInUrl="/sign-in"
                      redirectUrl="/"
                      appearance={{
                        elements: {
                          rootBox: {
                            width: '100%',
                            margin: 0,
                            padding: 0,
                          },
                          card: {
                            border: 'none',
                            boxShadow: 'none',
                            width: '100%',
                            margin: 0,
                            padding: 0,
                          },
                          formButtonPrimary: {
                            backgroundColor: theme.palette.primary.main,
                            '&:hover': {
                              backgroundColor: theme.palette.primary.dark,
                            },
                            width: '100%',
                            marginTop: '1rem',
                          },
                          formFieldInput: {
                            padding: '0.75rem',
                            fontSize: '1rem',
                            borderRadius: '0.5rem',
                            '@media (max-width: 600px)': {
                              padding: '0.5rem',
                              fontSize: '0.875rem',
                            },
                          },
                          footerActionLink: {
                            color: theme.palette.primary.main,
                            '&:hover': {
                              color: theme.palette.primary.dark,
                            },
                          },
                          header: {
                            '@media (max-width: 600px)': {
                              fontSize: '1.25rem',
                            },
                          },
                        },
                      }}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/sign-in" replace />} />
              </Routes>
            </Box>
          </Container>
        </Box>
      </SignedOut>
    </ThemeProvider>
  );
}

export default App;
