// filepath: /home/iot/IOT-Edge/backend/pages/api/sensors/data/[id].js
// Individual sensor data API route
import { withApi } from '../../../../middleware';
import { query, update, remove, isUsingMockData } from '../../../../utils/database';

/**
 * Get a specific sensor data reading by ID
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const getSensorDataById = async (req, res) => {
  try {
    const { id } = req.query;
    
    // Check if we're using mock data
    if (isUsingMockData()) {
      // Parse the mock ID to extract sensor ID and other info
      if (!id.startsWith('data-') && !id.startsWith('agg-')) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Sensor data reading not found'
        });
      }
      
      // Extract the sensor ID from the data ID
      // Format: data-SENSORID-INDEX or agg-SENSORID-DATE
      const parts = id.split('-');
      const isAggregated = id.startsWith('agg-');
      
      // Different parsing based on ID format
      let sensorId;
      if (isAggregated) {
        // For aggregated data: agg-SENSORID-DATE
        sensorId = parts[1];
      } else {
        // For regular data: data-SENSORID-INDEX
        sensorId = parts[1];
      }
      
      // Generate a mock reading
      const mockReading = {
        id,
        sensorId,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 1000000)).toISOString(),
        value: parseFloat((Math.random() * 100).toFixed(2)),
        unit: ['°C', '%', 'hPa', 'V', 'A'][Math.floor(Math.random() * 5)],
        status: 'normal'
      };
      
      // Add additional fields for aggregated data
      if (isAggregated) {
        mockReading.min = mockReading.value - (Math.random() * 5);
        mockReading.max = mockReading.value + (Math.random() * 5);
        mockReading.count = Math.floor(Math.random() * 200) + 50;
        mockReading.status = 'aggregated';
      }
      
      return res.status(200).json(mockReading);
    }
    
    // Using real database
    const sql = `
      SELECT 
        id,
        sensor_id as sensorId,
        timestamp,
        value,
        unit,
        status
      FROM sensor_data
      WHERE id = ?
    `;
    
    const result = await query(sql, [id]);
    
    if (result.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Sensor data reading not found'
      });
    }
    
    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error getting sensor data by ID:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Error retrieving sensor data',
      details: error.message
    });
  }
};

/**
 * Update a specific sensor data reading by ID
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const updateSensorData = async (req, res) => {
  try {
    const { id } = req.query;
    const { value, unit, status } = req.body;
    
    // Validate body - at least one field must be provided
    if (value === undefined && unit === undefined && status === undefined) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'At least one field to update must be provided'
      });
    }
    
    // Check if we're using mock data
    if (isUsingMockData()) {
      // Return a mock response
      return res.status(200).json({
        id,
        sensorId: id.split('-')[1], // Extract sensorId from the ID
        timestamp: new Date().toISOString(),
        value: value !== undefined ? value : parseFloat((Math.random() * 100).toFixed(2)),
        unit: unit || ['°C', '%', 'hPa', 'V', 'A'][Math.floor(Math.random() * 5)],
        status: status || 'normal'
      });
    }
    
    // Using real database
    // First, check if the reading exists
    const checkSql = 'SELECT id FROM sensor_data WHERE id = ?';
    const checkResult = await query(checkSql, [id]);
    
    if (checkResult.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Sensor data reading not found'
      });
    }
    
    // Build update data object
    const updateData = {};
    
    if (value !== undefined) updateData.value = value;
    if (unit !== undefined) updateData.unit = unit;
    if (status !== undefined) updateData.status = status;
    
    // Update the reading
    await update('sensor_data', updateData, { id });
    
    // Get the updated reading
    const sql = `
      SELECT 
        id,
        sensor_id as sensorId,
        timestamp,
        value,
        unit,
        status
      FROM sensor_data
      WHERE id = ?
    `;
    
    const result = await query(sql, [id]);
    
    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error updating sensor data:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Error updating sensor data',
      details: error.message
    });
  }
};

/**
 * Delete a specific sensor data reading by ID
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const deleteSensorData = async (req, res) => {
  try {
    const { id } = req.query;
    
    // Check if we're using mock data
    if (isUsingMockData()) {
      // Return a mock response
      return res.status(200).json({
        message: 'Sensor data deleted successfully',
        id
      });
    }
    
    // Using real database
    // First, check if the reading exists
    const checkSql = 'SELECT id FROM sensor_data WHERE id = ?';
    const checkResult = await query(checkSql, [id]);
    
    if (checkResult.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Sensor data reading not found'
      });
    }
    
    // Delete the reading
    await remove('sensor_data', { id });
    
    return res.status(200).json({
      message: 'Sensor data deleted successfully',
      id
    });
  } catch (error) {
    console.error('Error deleting sensor data:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Error deleting sensor data',
      details: error.message
    });
  }
};

/**
 * Handle individual sensor data requests
 */
const handleSensorDataById = async (req, res) => {
  switch (req.method) {
    case 'GET':
      return getSensorDataById(req, res);
    case 'PUT':
    case 'PATCH':
      return updateSensorData(req, res);
    case 'DELETE':
      return deleteSensorData(req, res);
    default:
      return res.status(405).json({
        error: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      });
  }
};

// Export the handler with middleware
export default withApi(handleSensorDataById, { auth: false });