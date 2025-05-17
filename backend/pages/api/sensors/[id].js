// Individual sensor API route
import { withApi } from '../../../middleware';
import { query, getOne, update, remove, isUsingMockData } from '../../../utils/database';
import fs from 'fs';
import path from 'path';

/**
 * Get a specific sensor by ID
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const getSensor = async (req, res) => {
  try {
    const { id } = req.query;
    
    // Check if we're using mock data
    if (isUsingMockData()) {
      // Try to load mock data from file
      const mockDataPath = path.join(process.cwd(), 'mock-data', 'sensors.json');
      
      if (fs.existsSync(mockDataPath)) {
        // Use mock data from file
        const rawData = fs.readFileSync(mockDataPath, 'utf8');
        let mockData = JSON.parse(rawData);
        
        // Find the specific sensor
        const sensor = mockData.find(s => s.id === id);
        
        if (!sensor) {
          return res.status(404).json({
            error: 'NOT_FOUND',
            message: `Sensor with ID ${id} not found`
          });
        }
        
        return res.status(200).json(sensor);
      }
      
      // If file doesn't exist, generate a mock sensor
      if (id) {
        const sensorTypes = ["temperature", "humidity", "pressure", "voltage", "current"];
        const sensorType = sensorTypes[parseInt(id) % sensorTypes.length];
        
        // Create detailed mock sensor data
        const mockSensor = {
          id: id,
          name: `Sensor ${id}`,
          type: sensorType,
          model: "TempSensor Pro 3000",
          manufacturer: "SensorTech Inc.",
          serialNumber: `TS3000-${id}`,
          location: "Building A",
          position: "front-right",
          installedDate: "2023-10-15T09:00:00.000Z",
          status: "active",
          lastReading: sensorType === "temperature" ? -18.5 : sensorType === "humidity" ? 45 : 220,
          lastUpdated: new Date().toISOString(),
          unit: sensorType === "temperature" ? "°C" : sensorType === "humidity" ? "%" : "V",
          minThreshold: sensorType === "temperature" ? -22 : 0,
          maxThreshold: sensorType === "temperature" ? -16 : 100,
          accuracy: 0.1,
          calibrationDate: "2024-01-15T14:00:00.000Z",
          nextCalibrationDate: "2024-07-15T14:00:00.000Z",
          firmware: {
            version: "2.5.1",
            lastUpdated: "2024-02-20T10:30:00.000Z"
          },
          maintenanceHistory: [
            {
              date: "2024-01-15T14:00:00.000Z",
              type: "calibration",
              technician: "Alice Johnson",
              notes: "Calibrated according to manufacturer specs"
            }
          ],
          dataHistory: {
            hourly: Array(24).fill(0).map((_, i) => ({
              timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
              value: sensorType === "temperature" ? -18.5 + (Math.random() - 0.5) : 
                    sensorType === "humidity" ? 45 + (Math.random() - 0.5) * 2 : 
                    220 + (Math.random() - 0.5) * 5
            })).reverse(),
            daily: Array(7).fill(0).map((_, i) => {
              const baseValue = sensorType === "temperature" ? -18.5 : 
                               sensorType === "humidity" ? 45 : 220;
              return {
                timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
                min: baseValue - Math.random(),
                max: baseValue + Math.random(),
                avg: baseValue
              };
            }).reverse()
          },
          alertHistory: [
            {
              id: 534,
              timestamp: "2024-05-11T08:15:00.000Z",
              type: `${sensorType}_deviation`,
              message: `${sensorType} briefly deviated from target`,
              resolved: true,
              resolvedAt: "2024-05-11T08:30:00.000Z"
            }
          ]
        };
        
        return res.status(200).json(mockSensor);
      }
      
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Sensor with ID ${id} not found`
      });
    }
    
    // Query the database for the sensor
    const sql = 'SELECT * FROM sensors WHERE id = ?';
    const sensor = await getOne(sql, [id]);
    
    if (!sensor) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Sensor with ID ${id} not found`
      });
    }
    
    // Get maintenance history
    const maintenanceSql = 'SELECT * FROM maintenance_records WHERE entity_type = ? AND entity_id = ? ORDER BY performed_at DESC';
    const maintenanceRecords = await query(maintenanceSql, ['sensor', id]);
    
    // Get alert history
    const alertSql = 'SELECT * FROM notifications WHERE source_type = ? AND source_id = ? ORDER BY timestamp DESC LIMIT 10';
    const alertRecords = await query(alertSql, ['sensor', id]);
    
    // Get sensor data history for charts (last 24 hours hourly and 7 days daily)
    const hourlyDataSql = `
      SELECT 
        DATE_FORMAT(timestamp, '%Y-%m-%dT%H:00:00.000Z') as timestamp,
        AVG(value) as value
      FROM sensor_data 
      WHERE sensor_id = ? 
      AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%dT%H:00:00.000Z')
      ORDER BY timestamp ASC
    `;
    
    const dailyDataSql = `
      SELECT 
        DATE_FORMAT(timestamp, '%Y-%m-%dT00:00:00.000Z') as timestamp,
        MIN(value) as min,
        MAX(value) as max,
        AVG(value) as avg
      FROM sensor_data 
      WHERE sensor_id = ? 
      AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%dT00:00:00.000Z')
      ORDER BY timestamp ASC
    `;
    
    const hourlyData = await query(hourlyDataSql, [id]);
    const dailyData = await query(dailyDataSql, [id]);
    
    // Format maintenance records
    const formattedMaintenanceRecords = maintenanceRecords.map(record => ({
      id: record.id,
      date: record.performed_at,
      type: record.type,
      technician: record.technician,
      notes: record.notes
    }));
    
    // Format alert records
    const formattedAlertRecords = alertRecords.map(alert => ({
      id: alert.id,
      timestamp: alert.timestamp,
      type: alert.type,
      message: alert.message,
      resolved: Boolean(alert.read),
      resolvedAt: alert.read_at
    }));
    
    // Format the response to match API documentation
    const formattedSensor = {
      id: sensor.id,
      name: sensor.name,
      type: sensor.type,
      model: sensor.model,
      manufacturer: sensor.manufacturer,
      serialNumber: sensor.serial_number,
      location: sensor.location,
      position: sensor.position,
      installedDate: sensor.installed_date,
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
      firmware: {
        version: sensor.firmware_version,
        lastUpdated: sensor.firmware_updated
      },
      maintenanceHistory: formattedMaintenanceRecords,
      dataHistory: {
        hourly: hourlyData.map(data => ({
          timestamp: data.timestamp,
          value: data.value
        })),
        daily: dailyData.map(data => ({
          timestamp: data.timestamp,
          min: data.min,
          max: data.max,
          avg: data.avg
        }))
      },
      alertHistory: formattedAlertRecords
    };
    
    return res.status(200).json(formattedSensor);
  } catch (error) {
    console.error('Error getting sensor:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Error retrieving sensor',
      details: error.message
    });
  }
};

/**
 * Update a sensor
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const updateSensor = async (req, res) => {
  try {
    const { id } = req.query;
    const updateData = req.body;
    
    // Validate the ID
    if (!id) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Sensor ID is required'
      });
    }
    
    // Using mock data
    if (isUsingMockData()) {
      return res.status(200).json({
        id,
        ...updateData,
        lastUpdated: new Date().toISOString()
      });
    }
    
    // Check if the sensor exists
    const checkSql = 'SELECT * FROM sensors WHERE id = ?';
    const existingSensor = await getOne(checkSql, [id]);
    
    if (!existingSensor) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Sensor with ID ${id} not found`
      });
    }
    
    // Map request fields to database fields
    const dbUpdateData = {};
    if (updateData.name) dbUpdateData.name = updateData.name;
    if (updateData.type) dbUpdateData.type = updateData.type;
    if (updateData.model) dbUpdateData.model = updateData.model;
    if (updateData.manufacturer) dbUpdateData.manufacturer = updateData.manufacturer;
    if (updateData.serialNumber) dbUpdateData.serial_number = updateData.serialNumber;
    if (updateData.location) dbUpdateData.location = updateData.location;
    if (updateData.position) dbUpdateData.position = updateData.position;
    if (updateData.status) dbUpdateData.status = updateData.status;
    if (updateData.unit) dbUpdateData.unit = updateData.unit;
    if (updateData.minThreshold !== undefined) dbUpdateData.min_threshold = updateData.minThreshold;
    if (updateData.maxThreshold !== undefined) dbUpdateData.max_threshold = updateData.maxThreshold;
    if (updateData.accuracy !== undefined) dbUpdateData.accuracy = updateData.accuracy;
    if (updateData.calibrationDate !== undefined) dbUpdateData.calibration_date = updateData.calibrationDate;
    if (updateData.calibrationDueDate !== undefined) dbUpdateData.calibration_due_date = updateData.calibrationDueDate;
    if (updateData.calibrationCertificateUrl !== undefined) dbUpdateData.calibration_certificate_url = updateData.calibrationCertificateUrl;
    
    // Always update the last_updated field
    dbUpdateData.last_updated = new Date().toISOString();
    
    // Update the sensor in the database
    await update('sensors', dbUpdateData, { id });
    
    // Get the updated sensor
    const updatedSensor = await getOne(checkSql, [id]);
    
    // Format the response
    const formattedUpdatedSensor = {
      id: updatedSensor.id,
      name: updatedSensor.name,
      type: updatedSensor.type,
      model: updatedSensor.model,
      manufacturer: updatedSensor.manufacturer,
      serialNumber: updatedSensor.serial_number,
      location: updatedSensor.location,
      position: updatedSensor.position,
      installedDate: updatedSensor.installed_date,
      status: updatedSensor.status,
      lastReading: updatedSensor.last_reading,
      lastUpdated: updatedSensor.last_updated,
      unit: updatedSensor.unit,
      minThreshold: updatedSensor.min_threshold,
      maxThreshold: updatedSensor.max_threshold,
      accuracy: updatedSensor.accuracy
    };
    
    return res.status(200).json(formattedUpdatedSensor);
  } catch (error) {
    console.error('Error updating sensor:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Error updating sensor',
      details: error.message
    });
  }
};

/**
 * Delete a sensor
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const deleteSensor = async (req, res) => {
  try {
    const { id } = req.query;
    
    // Validate the ID
    if (!id) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Sensor ID is required'
      });
    }
    
    // Using mock data
    if (isUsingMockData()) {
      return res.status(200).json({
        message: `Sensor deleted successfully`
      });
    }
    
    // Check if the sensor exists
    const checkSql = 'SELECT * FROM sensors WHERE id = ?';
    const existingSensor = await getOne(checkSql, [id]);
    
    if (!existingSensor) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Sensor with ID ${id} not found`
      });
    }
    
    // Delete the sensor
    await remove('sensors', { id });
    
    // Delete associated sensor data (in a real system, you might want to archive this data instead)
    await remove('sensor_data', { sensor_id: id });
    
    // Delete associated maintenance records
    await remove('maintenance_records', { entity_type: 'sensor', entity_id: id });
    
    return res.status(200).json({
      message: `Sensor deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting sensor:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Error deleting sensor',
      details: error.message
    });
  }
};

/**
 * Handle sensor requests for a specific ID
 */
const handleSensor = async (req, res) => {
  switch (req.method) {
    case 'GET':
      return getSensor(req, res);
    case 'PUT':
      return updateSensor(req, res);
    case 'DELETE':
      return deleteSensor(req, res);
    default:
      return res.status(405).json({
        error: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      });
  }
};

// Export the handler with middleware
export default withApi(handleSensor, { auth: false });