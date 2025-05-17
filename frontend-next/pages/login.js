import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
  useTheme as useMuiTheme,
  alpha,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  LockOutlined, 
  Visibility, 
  VisibilityOff,
  Person as PersonIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import axios from '../api/axiosConfig';
import Image from 'next/image';
import ThemeToggle from '../components/common/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import logger from '../utils/logger';
import { DEV_CONFIG } from '../config';
import storage from '../utils/storage';
import { checkBackendAvailability, getBackendAvailability } from '../api/axiosConfig';

// ستايل الورقة المخصصة لتسجيل الدخول
const LoginPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  width: '100%',
  maxWidth: 420,
  borderRadius: 16,
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 4,
    background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  }
}));

// ستايل حقل الإدخال المخصص
const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.mode === 'dark' 
        ? alpha(theme.palette.primary.main, 0.5) 
        : theme.palette.primary.light,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
    '& .MuiOutlinedInput-input': {
      padding: '14px 14px',
    },
  },
}));

// ستايل الزر المخصص
const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  padding: '12px 0',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: '#fff',
  fontWeight: 600,
  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.6)}`,
  },
}));

// مكون خلفية الصفحة
const PageBackground = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(45deg, ${alpha(theme.palette.primary.dark, 0.3)} 0%, ${alpha(theme.palette.secondary.dark, 0.3)} 100%)`
    : `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
  zIndex: -1,
}));

// Mock user data for development
const MOCK_USERS = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    email: 'admin@iot-edge.com',
    role: 'admin'
  },
  {
    id: 2,
    username: 'user',
    password: 'user123',
    name: 'Normal User',
    email: 'user@iot-edge.com',
    role: 'user'
  }
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'available', 'unavailable', 'checking'
  const router = useRouter();
  const muiTheme = useMuiTheme();
  const { isDarkMode } = useTheme();

  // Check backend availability on mount
  useEffect(() => {
    logger.info('Login page mounted');
    // Check if storage is available
    if (storage.setItem('test', 'test')) {
      storage.removeItem('test');
      logger.info('Storage is available');
    }
    
    // Check backend availability
    const checkBackend = async () => {
      try {
        const isAvailable = await checkBackendAvailability();
        setBackendStatus(isAvailable ? 'available' : 'unavailable');
      } catch (err) {
        setBackendStatus('unavailable');
      }
    };
    
    checkBackend();
    
    return () => {
      logger.info('Login page unmounted');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    logger.group('Login attempt');
    logger.info('Login attempt with username:', username);
    
    try {
      // Simple mock authentication
      logger.debug('Finding user in mock database');
      
      // Find user in mock users array
      const user = MOCK_USERS.find(
        u => u.username === username && u.password === password
      );
      
      if (!user) {
        logger.warn('Invalid credentials');
        setError('Invalid username or password');
        setLoading(false);
        logger.groupEnd();
        return;
      }
      
      logger.info('User found', { id: user.id, role: user.role });
      
      // Create a mock token
      const token = `mock-token-${user.id}-${Date.now()}`;
      
      // Store token and user info (remove sensitive info like password)
      const userToStore = { ...user };
      delete userToStore.password;
      
      logger.debug('Setting storage items');
      const tokenSaved = storage.setItem('token', token);
      const userSaved = storage.setItem('user', userToStore);
      
      if (!tokenSaved || !userSaved) {
        logger.error('Failed to set storage items');
        setError('Browser storage error. Please enable cookies and storage access.');
        setLoading(false);
        logger.groupEnd();
        return;
      }
      
      logger.info('Authentication successful, redirecting to dashboard');
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      logger.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        'Failed to login. Please check your credentials.'
      );
      setLoading(false);
    }
    
    logger.groupEnd();
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <>
      <Head>
        <title>Login | IOT-Edge Platform</title>
      </Head>
      
      {/* خلفية الصفحة */}
      <PageBackground />
      
      {/* زر تبديل الثيم */}
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <ThemeToggle />
      </Box>
      
      <Container 
        component="main" 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 480,
            width: '100%',
          }}
        >
          {/* الشعار */}
          <Box sx={{ mb: 4, width: 200, height: 60, position: 'relative' }}>
            {/* Fallback to text if image fails to load */}
            <Typography variant="h4" color="primary" fontWeight="bold" sx={{ visibility: 'hidden', position: 'absolute' }}>
              IOT-Edge
            </Typography>
            <Image
              src="/logo.svg"
              alt="IOT Edge"
              fill
              sizes="200px"
              style={{ objectFit: 'contain' }}
              priority
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.previousSibling.style.visibility = 'visible';
              }}
            />
          </Box>
          
          <LoginPaper>
            <Box 
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white', 
                borderRadius: '50%', 
                p: 1.5, 
                mb: 2,
                boxShadow: `0 4px 14px ${alpha(muiTheme.palette.primary.main, 0.4)}`,
              }}
            >
              <LockOutlined fontSize="large" />
            </Box>
            
            <Typography component="h1" variant="h4" sx={{ fontWeight: 600 }}>
              Sign In
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3, textAlign: 'center' }}>
              Enter your credentials to access the IOT-Edge platform
            </Typography>
            
            {backendStatus === 'unavailable' && (
              <Alert
                severity="info"
                sx={{ 
                  width: '100%', 
                  mb: 3, 
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Backend server is not available. 
                </Typography>
                <Typography variant="body2">
                  Use mock credentials: <strong>admin/admin123</strong> or <strong>user/user123</strong>
                </Typography>
              </Alert>
            )}
            
            {error && (
              <Alert
                severity="error"
                sx={{ 
                  width: '100%', 
                  mb: 3, 
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    color: muiTheme.palette.error.main
                  }
                }}
              >
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <StyledTextField
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <StyledTextField
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <StyledButton
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                disableElevation
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </StyledButton>
              
              <Divider sx={{ my: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  IOT-Edge Control Platform
                </Typography>
              </Divider>
              
              <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 1 }}>
                &copy; {new Date().getFullYear()} IOT-Edge. All rights reserved.
              </Typography>
            </Box>
          </LoginPaper>
        </Box>
      </Container>
    </>
  );
} 