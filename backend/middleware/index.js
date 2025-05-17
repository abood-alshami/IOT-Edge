/**
 * API Middleware
 * Applies common middleware to API routes
 */

import Cors from 'cors';
import jwt from 'jsonwebtoken';

// Initialize CORS middleware
const cors = Cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  origin: '*', // In production, you should restrict this
  credentials: true,
});

// Helper to run middleware
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Authentication middleware
const authenticate = async (req, res) => {
  try {
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, user: null };
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Special handling for development token
    if (process.env.NODE_ENV === 'development' && token.startsWith('dev-jwt')) {
      console.log('Using development JWT token');
      const parts = token.split('.');
      if (parts.length >= 3) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          return { authenticated: true, user: payload };
        } catch (e) {
          console.error('Error parsing dev token:', e);
        }
      }
    }
    
    // Verify token
    const secret = process.env.JWT_SECRET || 'your-default-secret-key-for-dev'; // Use env variable in production
    const decoded = jwt.verify(token, secret);
    
    return { authenticated: true, user: decoded };
  } catch (error) {
    console.error('Authentication error:', error.message);
    return { authenticated: false, user: null };
  }
};

/**
 * API wrapper that applies middleware to API handlers
 * 
 * @param {Function} handler - API route handler
 * @param {Object} options - Options
 * @param {boolean} options.auth - Whether authentication is required
 * @returns {Function} - Next.js API handler with middleware
 */
const withApi = (handler, options = { auth: true }) => {
  return async (req, res) => {
    try {
      // Run CORS middleware
      await runMiddleware(req, res, cors);
      
      // Skip authentication check completely if auth option is false
      if (options.auth === false) {
        // Skip authentication but fix URL if needed
        if (req.url && !req.url.startsWith('/api/') && !req.originalUrl) {
          req.originalUrl = req.url;
          req.url = `/api${req.url}`;
        }
        
        // Process the request with the handler directly
        return handler(req, res);
      }
      
      // Process authentication
      if (options.auth || req.headers.authorization) {
        const auth = await authenticate(req, res);
        
        if (options.auth && !auth.authenticated) {
          return res.status(401).json({ 
            error: 'AUTH_REQUIRED', 
            message: 'Authentication required'
          });
        }
        
        // Attach user to request if authenticated
        if (auth.authenticated) {
          req.user = auth.user;
          req.authenticated = true;
        }
      }
      
      // Fix URL format for frontend compatibility
      if (req.url && !req.url.startsWith('/api/') && !req.originalUrl) {
        req.originalUrl = req.url;
        req.url = `/api${req.url}`;
      }
      
      // Process the request with the handler
      return handler(req, res);
    } catch (error) {
      console.error('API middleware error:', error);
      return res.status(500).json({ 
        error: 'SERVER_ERROR', 
        message: 'Server error in API middleware'
      });
    }
  };
};

// Export using ESM syntax
export { withApi, cors, authenticate, runMiddleware }; 