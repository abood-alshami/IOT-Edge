/**
 * Monitoring API route
 */
import { withApi } from '../../../middleware';

/**
 * Get monitoring overview
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const getMonitoringOverview = async (req, res) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    }
    
    // In a real implementation, this would query the database
    // For now, we'll return mock data
    return res.status(200).json({
      status: "operational",
      totalSensors: 24,
      activeSensors: 22,
      alertCount: {
        critical: 1,
        warning: 2,
        info: 3
      },
      uptime: "4d 12h 35m",
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting monitoring overview:', error);
    return res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Error getting monitoring overview'
    });
  }
};

// Export the handler with middleware, but no authentication required
export default withApi(getMonitoringOverview, { auth: false }); 