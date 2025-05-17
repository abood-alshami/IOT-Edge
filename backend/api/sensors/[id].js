// Single sensor API route
import { withApi } from '../../middleware';
import db from '../../utils/database';

/**
 * Get a specific sensor by ID
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const getSensor = async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'INVALID_ID', message: 'Invalid sensor ID' });
    }
    
    const sensor = await db.getOne(
      'SELECT id, name, type, location, status, last_reading, last_updated FROM sensors WHERE id = ?',
      [id]
    );
    
    if (!sensor) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Sensor not found' });
    }
    
    return res.status(200).json(sensor);
  } catch (error) {
    console.error(`Error fetching sensor with ID ${req.query.id}:`, error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Error fetching sensor' });
  }
};

/**
 * Update a specific sensor by ID
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const updateSensor = async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'INVALID_ID', message: 'Invalid sensor ID' });
    }
    
    // Check if sensor exists
    const existingSensor = await db.getOne(
      'SELECT id FROM sensors WHERE id = ?',
      [id]
    );
    
    if (!existingSensor) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Sensor not found' });
    }
    
    // Extract update fields
    const { name, type, location, status } = req.body;
    
    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (location !== undefined) updateData.location = location;
    if (status !== undefined) updateData.status = status;
    
    // Add timestamp
    updateData.last_updated = new Date().toISOString();
    
    // Update the sensor
    const affectedRows = await db.update('sensors', updateData, { id });
    
    if (affectedRows === 0) {
      return res.status(500).json({ error: 'UPDATE_FAILED', message: 'Failed to update sensor' });
    }
    
    // Get the updated sensor
    const updatedSensor = await db.getOne(
      'SELECT id, name, type, location, status, last_reading, last_updated FROM sensors WHERE id = ?',
      [id]
    );
    
    return res.status(200).json(updatedSensor);
  } catch (error) {
    console.error(`Error updating sensor with ID ${req.query.id}:`, error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Error updating sensor' });
  }
};

/**
 * Delete a specific sensor by ID
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const deleteSensor = async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'INVALID_ID', message: 'Invalid sensor ID' });
    }
    
    // Check if sensor exists
    const existingSensor = await db.getOne(
      'SELECT id FROM sensors WHERE id = ?',
      [id]
    );
    
    if (!existingSensor) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Sensor not found' });
    }
    
    // Delete the sensor
    const result = await db.query(
      'DELETE FROM sensors WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'DELETE_FAILED', message: 'Failed to delete sensor' });
    }
    
    return res.status(200).json({ message: 'Sensor deleted successfully' });
  } catch (error) {
    console.error(`Error deleting sensor with ID ${req.query.id}:`, error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Error deleting sensor' });
  }
};

/**
 * Main handler for individual sensor API routes
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const handleSensor = async (req, res) => {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getSensor(req, res);
    case 'PUT':
    case 'PATCH':
      return updateSensor(req, res);
    case 'DELETE':
      return deleteSensor(req, res);
    default:
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
  }
};

// Export the handler with CORS and authentication middleware
export default withApi(handleSensor, { auth: true }); 