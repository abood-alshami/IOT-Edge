// Environment-specific configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

// Development flags
export const DEV_CONFIG = {
  USE_MOCK_AUTH: true,  // Set to false to use real backend authentication
  SIMULATE_NETWORK_DELAY: false,  // Set to true to simulate network delays
  MOCK_API_RESPONSES: true,  // Set to true to use mock API responses when backend is not available
};

// Feature flags
export const FEATURES = {
  NOTIFICATIONS: true,
  REAL_TIME_UPDATES: true,
  REPORTS: true,
  DARK_MODE: true
};

// Default settings
export const DEFAULTS = {
  PAGINATION: {
    PAGE_SIZE: 10,
    PAGE_SIZES: [10, 25, 50, 100]
  },
  DATE_FORMAT: 'yyyy-MM-dd HH:mm:ss',
  LOCALE: 'en-US',
  THEME: 'light'
}; 