// filepath: /home/iot/IOT-Edge/backend/pages/api/sensors/data/index.js
// Sensor data API route
import { withApi } from '../../../../middleware';
import { query, insert, isUsingMockData } from '../../../../utils/database';
import fs from 'fs';
import path from 'path';

/**
 * Get sensor data with filtering and pagination
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const getSensorData = async (req, res) => {
  try {
    const { 
      sensorId, 
      type,
      startDate, 
      endDate, 
      minValue, 
      maxValue,
      aggregation = 'none', // none, hourly, daily, weekly, monthly
      limit = 1000, 
      offset = 0 
    } = req.query;
    
    // Check if we're using mock data
    if (isUsingMockData()) {
      // Generate mock sensor data
      const generateMockData = (sensorId, count = 100) => {
        const sensorTypes = ["temperature", "humidity", "pressure", "voltage", "current"];
        // Use the last character of the sensorId to determine its type for consistent mock data
        const sensorType = sensorTypes[parseInt(sensorId.slice(-1)) % sensorTypes.length];
        
        // Base value depends on sensor type
        const baseValue = sensorType === "temperature" ? -18.5 : 
                        sensorType === "humidity" ? 45 : 
                        sensorType === "pressure" ? 1013 :
                        sensorType === "voltage" ? 220 : 5;
                        
        // Generate random readings for the past 'count' hours
        return Array(count).fill(0).map((_, index) => {
          // Random fluctuation around the base value
          const fluctuation = (Math.random() - 0.5) * 2;
          // Smaller fluctuation for hourly changes, larger for daily patterns
          const hourlyPattern = Math.sin(index % 24 * Math.PI / 12) * 1.5;
          const value = baseValue + fluctuation + hourlyPattern;
          
          return {
            id: `data-${sensorId}-${count - index}`,
            sensorId: sensorId,
            timestamp: new Date(Date.now() - index * 60 * 60 * 1000).toISOString(),
            value: parseFloat(value.toFixed(2)),
            unit: sensorType === "temperature" ? "°C" : 
                  sensorType === "humidity" ? "%" : 
                  sensorType === "pressure" ? "hPa" :
                  sensorType === "voltage" ? "V" : "A",
            status: "normal"
          };
        });
      };
      
      // If sensor ID provided, get data for that sensor
      if (sensorId) {
        const mockData = generateMockData(sensorId, 200);
        
        // Apply filters
        let filteredData = [...mockData];
        
        // Apply date filters
        if (startDate) {
          const startTimestamp = new Date(startDate).getTime();
          filteredData = filteredData.filter(data => new Date(data.timestamp).getTime() >= startTimestamp);
        }
        
        if (endDate) {
          const endTimestamp = new Date(endDate).getTime();
          filteredData = filteredData.filter(data => new Date(data.timestamp).getTime() <= endTimestamp);
        }
        
        // Apply value filters
        if (minValue !== undefined) {
          filteredData = filteredData.filter(data => data.value >= parseFloat(minValue));
        }
        
        if (maxValue !== undefined) {
          filteredData = filteredData.filter(data => data.value <= parseFloat(maxValue));
        }
        
        // Apply aggregation if requested
        let aggregatedData = filteredData;
        if (aggregation !== 'none') {
          const aggregateByTimePeriod = (data, periodFormatter) => {
            const groups = {};
            
            data.forEach(reading => {
              const date = new Date(reading.timestamp);
              const periodKey = periodFormatter(date);
              
              if (!groups[periodKey]) {
                groups[periodKey] = {
                  values: [],
                  timestamps: []
                };
              }
              
              groups[periodKey].values.push(reading.value);
              groups[periodKey].timestamps.push(new Date(reading.timestamp).getTime());
            });
            
            return Object.keys(groups).map(periodKey => {
              const values = groups[periodKey].values;
              const timestamps = groups[periodKey].timestamps;
              
              // Get earliest timestamp in the group for consistent sorting
              const earliestTimestamp = new Date(Math.min(...timestamps));
              
              return {
                id: `agg-${sensorId}-${periodKey}`,
                sensorId: sensorId,
                timestamp: earliestTimestamp.toISOString(),
                value: parseFloat((values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2)),
                min: parseFloat(Math.min(...values).toFixed(2)),
                max: parseFloat(Math.max(...values).toFixed(2)),
                count: values.length,
                unit: filteredData[0].unit,
                status: "aggregated"
              };
            }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort newest first
          };
          
          switch (aggregation) {
            case 'hourly':
              aggregatedData = aggregateByTimePeriod(
                filteredData, 
                (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}`
              );
              break;
            case 'daily':
              aggregatedData = aggregateByTimePeriod(
                filteredData, 
                (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
              );
              break;
            case 'weekly':
              // Get week number and year
              aggregatedData = aggregateByTimePeriod(
                filteredData, 
                (date) => {
                  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
                  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
                  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
                  return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
                }
              );
              break;
            case 'monthly':
              aggregatedData = aggregateByTimePeriod(
                filteredData, 
                (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
              );
              break;
            default:
              // No aggregation
              break;
          }
        }
        
        // Apply pagination
        const paginatedData = aggregatedData.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        return res.status(200).json({
          data: paginatedData,
          pagination: {
            total: aggregatedData.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
          }
        });
      }
      
      // If no sensor ID provided, return mock data for multiple sensors
      const mockSensors = Array(5).fill(0).map((_, index) => `SNS-${1000 + index}`);
      const allSensorData = [];
      
      mockSensors.forEach(sensorId => {
        // Generate less data per sensor in this case
        const sensorData = generateMockData(sensorId, 50);
        allSensorData.push(...sensorData);
      });
      
      // Sort by timestamp, newest first
      allSensorData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Apply pagination
      const paginatedData = allSensorData.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
      
      return res.status(200).json({
        data: paginatedData,
        pagination: {
          total: allSensorData.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    }
    
    // Using real database
    // Build SQL with filters
    let conditions = [];
    let params = [];
    let aggregationClause = '';
    let selectFields = `
      sd.id,
      sd.sensor_id as sensorId,
      sd.timestamp,
      sd.value,
      sd.unit,
      sd.status
    `;
    
    let fromClause = 'FROM sensor_data sd';
    
    // If sensor type filter is applied, join with sensors table
    if (type) {
      fromClause += ' JOIN sensors s ON sd.sensor_id = s.id';
      conditions.push('s.type = ?');
      params.push(type);
    }
    
    // Add sensor ID filter if provided
    if (sensorId) {
      conditions.push('sd.sensor_id = ?');
      params.push(sensorId);
    }
    
    // Add date range filters
    if (startDate) {
      conditions.push('sd.timestamp >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push('sd.timestamp <= ?');
      params.push(endDate);
    }
    
    // Add value range filters
    if (minValue !== undefined) {
      conditions.push('sd.value >= ?');
      params.push(parseFloat(minValue));
    }
    
    if (maxValue !== undefined) {
      conditions.push('sd.value <= ?');
      params.push(parseFloat(maxValue));
    }
    
    // Apply aggregation
    if (aggregation !== 'none') {
      let timeGrouping;
      
      switch (aggregation) {
        case 'hourly':
          timeGrouping = 'DATE_FORMAT(sd.timestamp, "%Y-%m-%dT%H:00:00.000Z")';
          break;
        case 'daily':
          timeGrouping = 'DATE_FORMAT(sd.timestamp, "%Y-%m-%dT00:00:00.000Z")';
          break;
        case 'weekly':
          // MySQL's YEARWEEK function returns the year and week number (0-53)
          timeGrouping = 'CONCAT(YEAR(sd.timestamp), "-W", LPAD(WEEK(sd.timestamp), 2, "0"))';
          break;
        case 'monthly':
          timeGrouping = 'DATE_FORMAT(sd.timestamp, "%Y-%m-01T00:00:00.000Z")';
          break;
        default:
          // No aggregation
          break;
      }
      
      if (timeGrouping) {
        selectFields = `
          CONCAT('agg-', MIN(sd.id)) as id,
          sd.sensor_id as sensorId,
          MIN(sd.timestamp) as timestamp,
          AVG(sd.value) as value,
          MIN(sd.value) as min,
          MAX(sd.value) as max,
          COUNT(*) as count,
          sd.unit,
          'aggregated' as status
        `;
        
        aggregationClause = `GROUP BY sd.sensor_id, ${timeGrouping}, sd.unit`;
      }
    }
    
    // Construct WHERE clause if we have conditions
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Count query for pagination
    let countSql;
    
    if (aggregation !== 'none') {
      // For aggregated queries, we need to count the groups
      countSql = `
        SELECT COUNT(*) as total FROM (
          SELECT 1
          ${fromClause}
          ${whereClause}
          ${aggregationClause}
        ) as aggregated_count
      `;
    } else {
      // Simple count for non-aggregated queries
      countSql = `
        SELECT COUNT(*) as total
        ${fromClause}
        ${whereClause}
      `;
    }
    
    // Execute count query
    const countResult = await query(countSql, params);
    const total = countResult[0].total;
    
    // Main query with pagination
    const sql = `
      SELECT ${selectFields}
      ${fromClause}
      ${whereClause}
      ${aggregationClause ? aggregationClause : ''}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;
    
    // Add pagination parameters
    params.push(parseInt(limit), parseInt(offset));
    
    // Execute main query
    const data = await query(sql, params);
    
    // Format the response
    return res.status(200).json({
      data,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting sensor data:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Error retrieving sensor data',
      details: error.message
    });
  }
};

/**
 * Add new sensor data readings
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const addSensorData = async (req, res) => {
  try {
    const { readings } = req.body;
    
    // Validate input
    if (!readings || !Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Readings array is required and must not be empty'
      });
    }
    
    // Validate each reading
    for (const reading of readings) {
      if (!reading.sensorId || reading.value === undefined) {
        return res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Each reading must have at least sensorId and value'
        });
      }
    }
    
    // Using mock data
    if (isUsingMockData()) {
      // Generate mock IDs for the response
      const processedReadings = readings.map((reading, index) => ({
        id: `data-${Date.now()}-${index}`,
        sensorId: reading.sensorId,
        timestamp: reading.timestamp || new Date().toISOString(),
        value: reading.value,
        unit: reading.unit || 'unknown',
        status: reading.status || 'normal'
      }));
      
      return res.status(201).json({
        message: 'Sensor data added successfully',
        data: processedReadings
      });
    }
    
    // Process each reading and insert into database
    const processedReadings = [];
    
    for (const reading of readings) {
      // Format the reading for database
      const timestamp = reading.timestamp || new Date().toISOString();
      
      const dbReading = {
        sensor_id: reading.sensorId,
        timestamp,
        value: reading.value,
        unit: reading.unit || '', // Default to empty string if not provided
        status: reading.status || 'normal'
      };
      
      // Insert into database
      const result = await insert('sensor_data', dbReading);
      
      // Format for response
      processedReadings.push({
        id: result.id,
        sensorId: reading.sensorId,
        timestamp,
        value: reading.value,
        unit: reading.unit || '',
        status: reading.status || 'normal'
      });
      
      // Update the sensor's last reading and last updated time
      await query(`
        UPDATE sensors 
        SET last_reading = ?, last_updated = ? 
        WHERE id = ?
      `, [reading.value, timestamp, reading.sensorId]);
    }
    
    return res.status(201).json({
      message: 'Sensor data added successfully',
      data: processedReadings
    });
  } catch (error) {
    console.error('Error adding sensor data:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Error adding sensor data',
      details: error.message
    });
  }
};

/**
 * Handle sensor data requests
 */
const handleSensorData = async (req, res) => {
  switch (req.method) {
    case 'GET':
      return getSensorData(req, res);
    case 'POST':
      return addSensorData(req, res);
    default:
      return res.status(405).json({
        error: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      });
  }
};

// Export the handler with middleware
export default withApi(handleSensorData, { auth: false });