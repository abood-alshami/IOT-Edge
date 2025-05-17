// Health check API route
import { withApi } from '../middleware';

/**
 * Health check endpoint
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const healthHandler = async (req, res) => {
  try {
    // If not a GET request, return method not allowed
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    }
    
    // Return health status
    return res.status(200).json({
      status: 'ok',
      message: 'API server is operational',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '5.0.1',
      env: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Server error in health check' });
  }
};

// Export the handler with CORS middleware
// No authentication required for health check
export default withApi(healthHandler, { auth: false }); 