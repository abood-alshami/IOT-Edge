// Sensor data API route
import { withApi } from '../../../middleware';
import { query, getOne, insert, update, remove, isConnected, useMockData, isUsingMockData } from '../../../utils/database';

/**
 * Get sensor data with optional filtering
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const getSensorData = async (req, res) => {
  try {
    const { sensorId, startDate, endDate, limit = 100 } = req.query;
    
    let sql = 'SELECT sd.id, sd.sensor_id, s.name as sensor_name, s.type, sd.value, sd.unit, sd.timestamp, COALESCE(s.status, "normal") as status ' +
              'FROM sensor_data sd ' +
              'LEFT JOIN sensors s ON sd.sensor_id = s.id ';
    
    const queryParams = [];
    const conditions = [];
    
    // Add filter conditions if provided
    if (sensorId) {
      conditions.push('sd.sensor_id = ?');
      queryParams.push(sensorId);
    }
    
    if (startDate) {
      conditions.push('sd.timestamp >= ?');
      queryParams.push(new Date(startDate).toISOString());
    }
    
    if (endDate) {
      conditions.push('sd.timestamp <= ?');
      queryParams.push(new Date(endDate).toISOString());
    }
    
    // Add WHERE clause if we have conditions
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Add order and limit
    sql += ' ORDER BY sd.timestamp DESC LIMIT ?';
    queryParams.push(parseInt(limit));
    
    // Query the database
    let sensorData = await query(sql, queryParams);
    
    // If no data found and we're using mock data, generate some
    if (sensorData.length === 0 && isUsingMockData()) {
      const generateMockData = (id, count) => {
        const now = new Date();
        const data = [];
        const sensorTypes = {
          "1": { type: "temperature", unit: "°C", baseValue: 22 },
          "2": { type: "humidity", unit: "%", baseValue: 45 },
          "3": { type: "pressure", unit: "hPa", baseValue: 1013 },
          "4": { type: "voltage", unit: "V", baseValue: 220 },
          "5": { type: "current", unit: "A", baseValue: 10 }
        };
        
        const sensorInfo = sensorTypes[id] || { type: "generic", unit: "units", baseValue: 50 };
        
        for (let i = 0; i < count; i++) {
          const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)); // hourly data
          let value = sensorInfo.baseValue + (Math.random() * 10 - 5); // random variation
          
          if (sensorInfo.type === "temperature") {
            value = parseFloat(value.toFixed(1)); // one decimal for temperature
          } else if (sensorInfo.type === "humidity") {
            value = Math.round(value); // whole number for humidity
          } else {
            value = parseFloat(value.toFixed(2)); // two decimals for other types
          }
          
          data.push({
            id: i + 1,
            sensor_id: id,
            sensor_name: `Sensor ${id} (${sensorInfo.type})`,
            type: sensorInfo.type,
            value: value,
            unit: sensorInfo.unit,
            timestamp: timestamp.toISOString(),
            status: "normal"
          });
        }
        
        return data;
      };
      
      if (sensorId) {
        sensorData.push(...generateMockData(sensorId, parseInt(limit)));
      } else {
        for (let i = 1; i <= 5; i++) {
          sensorData.push(...generateMockData(i.toString(), Math.floor(parseInt(limit) / 5)));
        }
        
        sensorData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        sensorData = sensorData.slice(0, parseInt(limit));
      }
    }
    
    // Return with a proper wrapper object
    return res.status(200).json({
      readings: sensorData,
      timestamp: new Date().toISOString()
    });
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
    
    // Check if the sensor exists
    const sensorExists = await getOne('SELECT id FROM sensors WHERE id = ?', [sensorId]);
    if (!sensorExists && !isUsingMockData()) {
      return res.status(404).json({
        error: 'SENSOR_NOT_FOUND',
        message: `Sensor with ID ${sensorId} not found`
      });
    }
    
    // Prepare data for insertion
    const data = {
      sensor_id: sensorId,
      value: parseFloat(value),
      unit: unit,
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
    };
    
    // Insert into database
    const insertId = await insert('sensor_data', data);
    
    // Get the inserted record
    const insertedData = await getOne(
      'SELECT sd.id, sd.sensor_id, s.name as sensor_name, s.type, sd.value, sd.unit, sd.timestamp, COALESCE(s.status, "normal") as status ' +
      'FROM sensor_data sd ' +
      'LEFT JOIN sensors s ON sd.sensor_id = s.id ' +
      'WHERE sd.id = ?',
      [insertId]
    );
    
    // Update the last_reading and last_updated fields of the sensor
    await update('sensors', {
      last_reading: data.value,
      last_updated: data.timestamp
    }, { id: sensorId });
    
    return res.status(201).json(insertedData || { 
      id: insertId,
      ...data,
      status: 'normal'
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

// Export the handler with CORS and no authentication required
export default withApi(handleSensorData, { auth: false });