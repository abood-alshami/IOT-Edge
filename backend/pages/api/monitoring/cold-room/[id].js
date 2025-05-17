/**
 * Individual Cold Room monitoring API route
 */
import { withApi } from '../../../../middleware';

/**
 * Get data for a specific cold room
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const getColdRoomById = async (req, res) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    }
    
    // Get the cold room ID from the URL
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Cold room ID is required'
      });
    }
    
    // In a real implementation, this would query the database
    // For now, we'll generate mock data for the specific cold room
    const baseTemp = 4 + (parseInt(id) % 3) * 0.5;
    const currentTemp = (baseTemp + (Math.random() - 0.5) * 0.6).toFixed(1);
    const isInRange = parseFloat(currentTemp) >= baseTemp - 1 && parseFloat(currentTemp) <= baseTemp + 1;
    const isDoorClosed = Math.random() < 0.9;
    
    const coldRoom = {
      id: parseInt(id),
      name: `Cold Room ${id}`,
      temperature: parseFloat(currentTemp),
      humidity: Math.floor(60 + Math.random() * 20),
      temperatureRange: {
        min: baseTemp - 1,
        max: baseTemp + 1
      },
      doorStatus: isDoorClosed ? "Closed" : "Open",
      doorLastOpened: isDoorClosed ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : new Date().toISOString(),
      sfdaCompliant: isInRange && isDoorClosed,
      lastUpdated: new Date().toISOString(),
      additionalInfo: {
        model: `CR-${1000 + parseInt(id) * 100}`,
        installDate: `2024-0${1 + (parseInt(id) % 3)}-${1 + (parseInt(id) % 20)}`,
        manufacturer: "ColdTech Industries",
        dimensions: `${4 + (parseInt(id) % 3)}m x ${3 + (parseInt(id) % 2)}m x 2.8m`,
        volume: `${30 + (parseInt(id) * 5)}m³`,
        coolingSystem: "H-Series Industrial",
        lastMaintenance: new Date(Date.now() - (30 + parseInt(id) * 5) * 24 * 60 * 60 * 1000).toISOString()
      }
    };
    
    return res.status(200).json(coldRoom);
  } catch (error) {
    console.error('Error getting cold room data:', error);
    return res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Error getting cold room data' 
    });
  }
};

// Export the handler with middleware, no authentication required
export default withApi(getColdRoomById, { auth: false }); 