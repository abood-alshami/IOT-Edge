// Recent notifications API route
import { withApi } from '../../../middleware';

/**
 * Get recent notifications for a user
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const getRecentNotifications = async (req, res) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    }
    
    // If authenticated, get the user from the request
    const userId = req.user?.id || null;
    
    // Get the limit query parameter (default to 5)
    const limit = parseInt(req.query.limit || '5', 10);
    
    // In a real implementation, this would query the database
    // For now, we'll return a mock response
    const notifications = [];
    
    // Generate random notifications
    for (let i = 0; i < limit; i++) {
      const severity = ['info', 'warning', 'critical'][Math.floor(Math.random() * 3)];
      const isAcknowledged = Math.random() > 0.7;
      
      notifications.push({
        id: `not-${i + 1}`,
        title: `System Notification ${i + 1}`,
        message: `This is a sample ${severity} notification for testing purposes`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(), // Each one hour older
        severity,
        acknowledged: isAcknowledged,
        userId: userId
      });
    }
    
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Error getting recent notifications:', error);
    return res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Error getting recent notifications'
    });
  }
};

// Export the handler with CORS middleware
// Authentication is optional for this endpoint
export default withApi(getRecentNotifications, { auth: false }); 