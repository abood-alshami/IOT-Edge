// Sensor data API route
import { withApi } from '../../middleware';
import db from '../../utils/database';
import { queueSensorData } from '../../utils/queueService.js';

/**
 * Get sensor data with optional filtering
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const getSensorData = async (req, res) => {
  try {
    const { sensorId, startDate, endDate, limit = 100 } = req.query;
    
    // Build the query
    let sql = 'SELECT * FROM sensor_data';
    const params = [];
    const conditions = [];
    
    // Add sensor ID filter if provided
    if (sensorId) {
      conditions.push('sensor_id = ?');
      params.push(sensorId);
    }
    
    // Add date range filters if provided
    if (startDate) {
      conditions.push('timestamp >= ?');
      params.push(new Date(startDate).toISOString());
    }
    
    if (endDate) {
      conditions.push('timestamp <= ?');
      params.push(new Date(endDate).toISOString());
    }
    
    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Add ordering
    sql += ' ORDER BY timestamp DESC';
    
    // Add limit
    sql += ' LIMIT ?';
    params.push(parseInt(limit));
    
    // Execute the query
    const sensorData = await db.query(sql, params);
    
    return res.status(200).json(sensorData);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Error fetching sensor data' });
  }
};

/**
 * Add new sensor data reading
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const addSensorData = async (req, res) => {
  try {
    const { sensorId, value, unit, timestamp } = req.body;
    
    // Validate required fields
    if (!sensorId || value === undefined || !unit) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Sensor ID, value, and unit are required'
      });
    }
    
    // Check if sensor exists
    const sensor = await db.getOne(
      'SELECT id, name, type, min_threshold as minThreshold, max_threshold as maxThreshold FROM sensors WHERE id = ?',
      [sensorId]
    );
    
    if (!sensor) {
      return res.status(404).json({ error: 'SENSOR_NOT_FOUND', message: 'Sensor not found' });
    }
    
    // Create data object
    const dataObj = {
      sensor_id: sensorId,
      value,
      unit,
      timestamp: timestamp || new Date().toISOString()
    };
    
    // Insert data
    const id = await db.insert('sensor_data', dataObj);
    
    // Update the sensor's last reading
    await db.update('sensors', {
      last_reading: value,
      last_updated: dataObj.timestamp
    }, { id: sensorId });
    
    // Prepare data for real-time processing
    const sensorData = {
      id,
      sensorId,
      sensorName: sensor.name,
      sensorType: sensor.type,
      value,
      unit,
      timestamp: dataObj.timestamp,
      minThreshold: sensor.minThreshold,
      maxThreshold: sensor.maxThreshold
    };
    
    // Queue the data for real-time processing
    await queueSensorData(sensorData);
    
    // Return success
    return res.status(201).json({
      id,
      ...dataObj,
      queued: true
    });
  } catch (error) {
    console.error('Error adding sensor data:', error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Error adding sensor data' });
  }
};

/**
 * Main handler for sensor data API
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const handleSensorData = async (req, res) => {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getSensorData(req, res);
    case 'POST':
      return addSensorData(req, res);
    default:
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
  }
};

// Export the handler with CORS and authentication middleware
export default withApi(handleSensorData, { auth: true });