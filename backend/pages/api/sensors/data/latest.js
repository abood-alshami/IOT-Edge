/**
 * Latest sensor data API route
 */
import { withApi } from '../../../../middleware';
import { query } from '../../../../utils/database';

/**
 * Get latest data for all sensors with optional filtering
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const getLatestSensorData = async (req, res) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    }
    
    // Get query parameters for more flexibility
    const { sensorId, type, limit = 20 } = req.query;
    
    // Build SQL with optional filters but without the problematic DATE_SUB function
    let sql = `
      SELECT sd.*, s.name, s.type, s.status
      FROM sensor_data sd
      JOIN sensors s ON sd.sensor_id = s.id
    `;
    
    const params = [];
    const conditions = [];
    
    // Add sensor ID filter if provided
    if (sensorId) {
      conditions.push(`sd.sensor_id = ?`);
      params.push(sensorId);
    }
    
    // Add sensor type filter if provided
    if (type) {
      conditions.push(`s.type = ?`);
      params.push(type);
    }
    
    // Add WHERE clause if we have conditions
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add ordering and limit
    sql += ` ORDER BY sd.timestamp DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    // Query the database
    const readings = await query(sql, params);
    
    return res.status(200).json({ 
      readings: readings || [],
      timestamp: new Date().toISOString(),
      filters: { sensorId, type, limit }
    });
  } catch (error) {
    console.error('Error getting latest sensor data:', error);
    return res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Error getting latest sensor data'
    });
  }
};

// Export the handler with middleware, no authentication required
export default withApi(getLatestSensorData, { auth: false });