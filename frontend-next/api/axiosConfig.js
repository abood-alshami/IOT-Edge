import axios from 'axios';
import { API_URL, DEV_CONFIG } from '../config';
import storage from '../utils/storage';
import logger from '../utils/logger';

// Flag to track if the backend is available
let isBackendAvailable = false;

// Function to check if the backend is available
export const checkBackendAvailability = async () => {
  try {
    // Try to reach the server with a simple request
    const response = await axios.get(`${API_URL}/health`, { 
      timeout: 2000 // Short timeout 
    });
    
    isBackendAvailable = response.status === 200;
    logger.info(`Backend availability check: ${isBackendAvailable ? 'Available' : 'Unavailable'}`);
    
    // Store the status for other components to check
    storage.setItem('backendAvailable', isBackendAvailable);
    
    return isBackendAvailable;
  } catch (error) {
    isBackendAvailable = false;
    logger.warn('Backend server is not available', error.message);
    storage.setItem('backendAvailable', false);
    return false;
  }
};

// Try to check backend availability when this module is first loaded
// Do this check asynchronously
if (typeof window !== 'undefined') {
  checkBackendAvailability().catch(() => {
    // Silently fail if the check doesn't work
  });
}

// Create axios instance
const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach authorization token
instance.interceptors.request.use(
  (config) => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const token = storage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    logger.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
instance.interceptors.response.use(
  (response) => {
    // Update backend availability flag on successful response
    isBackendAvailable = true;
    storage.setItem('backendAvailable', true);
    return response;
  },
  (error) => {
    // Special handling for development mode without backend
    if (error.message && error.message.includes('Network Error')) {
      logger.warn('Network error detected. Backend may not be running.');
      isBackendAvailable = false;
      storage.setItem('backendAvailable', false);
      
      // For development, you might want to create a mock response
      // This is especially useful when the backend isn't running
      if (DEV_CONFIG.MOCK_API_RESPONSES && error.config && error.config.url) {
        const url = error.config.url;
        
        // If this was a login request, we'll let the login component handle it
        // since we've implemented mock authentication there
        if (url.includes('/auth/login')) {
          logger.info('Mocking login response');
          return Promise.reject({
            response: {
              status: 401,
              data: { message: 'Backend server is not available. Use mock login credentials.' }
            }
          });
        }
      }
    }
    
    // Handle unauthorized errors (token expired, etc.)
    if (error.response && error.response.status === 401) {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        // If the token is mock but still valid, don't log out
        const token = storage.getItem('token');
        if (token && typeof token === 'string' && token.startsWith('mock-token-')) {
          // Allow the request to fail but don't log out
          logger.debug('Mock token detected, not logging out');
          return Promise.reject(error);
        }
        
        logger.info('Unauthorized request, logging out');
        storage.removeItem('token');
        storage.removeItem('user');
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    if (error.response) {
      logger.error('Response error:', error.response.status, error.response.data);
    } else {
      logger.error('Request failed:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Export isBackendAvailable getter
export const getBackendAvailability = () => isBackendAvailable;

export default instance; 