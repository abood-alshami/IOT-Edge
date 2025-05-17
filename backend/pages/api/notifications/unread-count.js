// Notifications unread count API route
import { withApi } from '../../../middleware';

/**
 * Get the number of unread notifications for a user
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const getUnreadCount = async (req, res) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    }
    
    // If authenticated, get the user from the request
    const userId = req.user?.id || null;
    
    // In a real implementation, this would query the database
    // For now, we'll return a mock response
    return res.status(200).json({
      count: Math.floor(Math.random() * 5), // Random number between 0 and 4
      userId: userId
    });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Error getting notification count'
    });
  }
};

// Export the handler with CORS middleware
// Authentication is optional for this endpoint
export default withApi(getUnreadCount, { auth: false }); 