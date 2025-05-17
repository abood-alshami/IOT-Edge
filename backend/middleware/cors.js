// CORS middleware for Next.js API routes
const nextCors = require('nextjs-cors');
const config = require('../config');

/**
 * CORS middleware for Next.js API routes
 * 
 * @param {Function} handler - The Next.js API route handler
 * @returns {Function} - Middleware wrapped handler
 */
const withCors = (handler) => {
  return async (req, res) => {
    try {
      // Set up CORS options
      await nextCors(req, res, {
        // Allow requests from the frontend
        origin: [
          config.server.baseUrl,
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5000',
          // Add any other allowed origins here
        ],
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'Accept',
          'X-API-Key',
        ],
      });
      
      // Continue to the handler
      return handler(req, res);
    } catch (error) {
      console.error('CORS middleware error:', error);
      return res.status(500).json({ error: 'SERVER_ERROR', message: 'Server error in CORS middleware' });
    }
  };
};

module.exports = withCors; 