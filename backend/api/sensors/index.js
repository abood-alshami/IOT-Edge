// Sensors API route
import { withApi } from '../../middleware';
import db from '../../utils/database';

/**
 * Get all sensors
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const getSensors = async (req, res) => {
  try {
    // Query the database for all sensors
    const sensors = await db.query(
      'SELECT id, name, type, location, status, last_reading, last_updated FROM sensors ORDER BY id'
    );
    
    return res.status(200).json(sensors);
  } catch (error) {
    console.error('Error fetching sensors:', error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Error fetching sensors' });
  }
};

/**
 * Create a new sensor
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const createSensor = async (req, res) => {
  try {
    // Validate required fields
    const { name, type, location } = req.body;
    
    if (!name || !type || !location) {
      return res.status(400).json({ 
        error: 'INVALID_REQUEST', 
        message: 'Name, type, and location are required' 
      });
    }
    
    // Insert the new sensor
    const sensorId = await db.insert('sensors', {
      name,
      type,
      location,
      status: 'active',
      last_reading: null,
      last_updated: new Date().toISOString(),
    });
    
    // Return the newly created sensor
    const newSensor = await db.getOne(
      'SELECT id, name, type, location, status, last_reading, last_updated FROM sensors WHERE id = ?',
      [sensorId]
    );
    
    return res.status(201).json(newSensor);
  } catch (error) {
    console.error('Error creating sensor:', error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Error creating sensor' });
  }
};

/**
 * Main handler for the sensors API
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const handleSensors = async (req, res) => {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getSensors(req, res);
    case 'POST':
      return createSensor(req, res);
    default:
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
  }
};

// Export the handler with CORS and authentication middleware
export default withApi(handleSensors, { auth: true }); 