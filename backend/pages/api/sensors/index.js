// Sensors API route
import { withApi } from '../../../middleware';
import { query, getOne, insert, update, remove, isConnected, useMockData, isUsingMockData } from '../../../utils/database';
import fs from 'fs';
import path from 'path';

/**
 * Get all sensors with filtering options
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const getSensors = async (req, res) => {
  try {
    // Parse query parameters for filtering
    const { 
      type, 
      location, 
      status, 
      limit = 100, 
      offset = 0 
    } = req.query;
    
    // Check if we're using mock data
    if (isUsingMockData()) {
      // Try to load mock data from file
      const mockDataPath = path.join(process.cwd(), 'mock-data', 'sensors.json');
      
      if (fs.existsSync(mockDataPath)) {
        // Use mock data from file
        const rawData = fs.readFileSync(mockDataPath, 'utf8');
        let mockData = JSON.parse(rawData);
        
        // Apply filters
        if (type) {
          mockData = mockData.filter(sensor => 
            sensor.type.toLowerCase() === type.toLowerCase());
        }
        if (location) {
          mockData = mockData.filter(sensor => 
            sensor.location.toLowerCase().includes(location.toLowerCase()));
        }
        if (status) {
          mockData = mockData.filter(sensor => 
            sensor.status.toLowerCase() === status.toLowerCase());
        }
        
        // Apply pagination
        const paginatedData = mockData.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        return res.status(200).json({
          data: paginatedData,
          pagination: {
            total: mockData.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
          }
        });
      }
      
      // Generate mock sensors if file doesn't exist
      const mockSensors = Array(20).fill(0).map((_, index) => {
        const sensorTypes = ["temperature", "humidity", "pressure", "voltage", "current", "motion", "door", "water", "flow", "co2"];
        const locations = ["Cold Room", "HVAC", "Electrical Panel", "Generator", "Fire System", "Entrance", "Water System"];
        const statuses = ["active", "inactive", "maintenance", "warning"];
        
        const sensorType = sensorTypes[index % sensorTypes.length];
        const sensorLocation = locations[Math.floor(index / 3) % locations.length];
        
        return {
          id: `SNS-${1000 + index}`,
          name: `${sensorLocation} ${sensorType} ${index + 1}`,
          type: sensorType,
          location: sensorLocation,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          lastReading: Math.random() * 100,
          lastUpdated: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          unit: sensorType === 'temperature' ? '°C' : 
                sensorType === 'humidity' ? '%' : 
                sensorType === 'pressure' ? 'Pa' : 
                sensorType === 'voltage' ? 'V' : 
                sensorType === 'current' ? 'A' : '',
          minThreshold: sensorType === 'temperature' ? -30 : 0,
          maxThreshold: sensorType === 'temperature' ? 30 : 100
        };
      });
      
      // Apply filters
      let filteredMockSensors = [...mockSensors];
      if (type) {
        filteredMockSensors = filteredMockSensors.filter(sensor => 
          sensor.type.toLowerCase() === type.toLowerCase());
      }
      if (location) {
        filteredMockSensors = filteredMockSensors.filter(sensor => 
          sensor.location.toLowerCase().includes(location.toLowerCase()));
      }
      if (status) {
        filteredMockSensors = filteredMockSensors.filter(sensor => 
          sensor.status.toLowerCase() === status.toLowerCase());
      }
      
      // Apply pagination
      const paginatedMockSensors = filteredMockSensors.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
      
      return res.status(200).json({
        data: paginatedMockSensors,
        pagination: {
          total: filteredMockSensors.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    }
    
    // If not using mock data, query the database with filters
    let sql = 'SELECT * FROM sensors WHERE 1=1';
    const params = [];
    
    // Add filter conditions
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (location) {
      sql += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    // Get total count for pagination
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await query(countSql, params);
    const total = countResult[0].total;
    
    // Add pagination
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    // Execute the query
    const sensors = await query(sql, params);
    
    // Format data to match API documentation
    const formattedSensors = sensors.map(sensor => ({
      id: sensor.id,
      name: sensor.name,
      type: sensor.type,
      location: sensor.location,
      status: sensor.status,
      lastReading: sensor.last_reading,
      lastUpdated: sensor.last_updated,
      unit: sensor.unit,
      minThreshold: sensor.min_threshold,
      maxThreshold: sensor.max_threshold,
      accuracy: sensor.accuracy,
      calibrationDate: sensor.calibration_date,
      calibrationDueDate: sensor.calibration_due_date,
      calibrationCertificateUrl: sensor.calibration_certificate_url,
      manufacturer: sensor.manufacturer,
      model: sensor.model,
      serialNumber: sensor.serial_number
    }));
    
    return res.status(200).json({
      data: formattedSensors,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting sensors:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Error retrieving sensors',
      details: error.message
    });
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
    const { 
      name, 
      type, 
      model,
      manufacturer,
      serialNumber,
      location, 
      position,
      unit,
      minThreshold,
      maxThreshold,
      accuracy,
      calibrationDate,
      calibrationDueDate,
      calibrationCertificateUrl
    } = req.body;
    
    // Validate required fields
    if (!name || !type || !location) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Name, type, and location are required'
      });
    }
    
    // If using mock data, just return success
    if (isUsingMockData()) {
      const sensorId = `SNS-${1000 + Math.floor(Math.random() * 9000)}`;
      return res.status(201).json({
        id: sensorId,
        name,
        type,
        model: model || 'Generic Sensor',
        manufacturer: manufacturer || 'Generic',
        serialNumber: serialNumber || `SN-${Math.floor(Math.random() * 10000)}`,
        location,
        position: position || 'center',
        installedDate: new Date().toISOString(),
        status: 'active',
        lastReading: null,
        lastUpdated: new Date().toISOString(),
        unit: unit || (type === 'temperature' ? '°C' : type === 'humidity' ? '%' : ''),
        minThreshold: minThreshold || 0,
        maxThreshold: maxThreshold || 100
      });
    }
    
    // Prepare data for database
    const now = new Date().toISOString();
    const sensorData = {
      name,
      type,
      model: model || 'Generic Sensor',
      manufacturer: manufacturer || 'Generic',
      serial_number: serialNumber || `SN-${Math.floor(Math.random() * 10000)}`,
      location,
      position: position || 'center',
      installed_date: now,
      status: 'active',
      last_reading: null,
      last_updated: now,
      unit: unit || (type === 'temperature' ? '°C' : type === 'humidity' ? '%' : ''),
      min_threshold: minThreshold || 0,
      max_threshold: maxThreshold || 100,
      accuracy: accuracy || null,
      calibration_date: calibrationDate || null,
      calibration_due_date: calibrationDueDate || null,
      calibration_certificate_url: calibrationCertificateUrl || null
    };
    
    // Insert into database
    const result = await insert('sensors', sensorData);
    
    return res.status(201).json({
      id: result.id,
      name,
      type,
      model: sensorData.model,
      manufacturer: sensorData.manufacturer,
      serialNumber: sensorData.serial_number,
      location,
      position: sensorData.position,
      installedDate: sensorData.installed_date,
      status: sensorData.status,
      lastReading: null,
      lastUpdated: sensorData.last_updated,
      unit: sensorData.unit,
      minThreshold: sensorData.min_threshold,
      maxThreshold: sensorData.max_threshold
    });
  } catch (error) {
    console.error('Error creating sensor:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Error creating sensor',
      details: error.message
    });
  }
};

/**
 * Handle sensor requests
 */
const handleSensors = async (req, res) => {
  switch (req.method) {
    case 'GET':
      return getSensors(req, res);
    case 'POST':
      return createSensor(req, res);
    default:
      return res.status(405).json({
        error: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      });
  }
};

// Export the handler with middleware, no authentication required
export default withApi(handleSensors, { auth: false });