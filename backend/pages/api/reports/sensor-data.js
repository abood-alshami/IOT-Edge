/**
 * Get sensor data report API route
 */
import { withApi } from '../../../middleware';

/**
 * Generate sensor data reports based on query parameters
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const getSensorDataReport = async (req, res) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    }
    
    // Extract query parameters
    const { sensorType, interval, timeRange, days } = req.query;
    
    // Validate required parameters
    if (!sensorType || !interval) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Sensor type and interval are required'
      });
    }
    
    // In a real implementation, this would query the database for actual sensor data
    // For now, we'll return mock data based on the parameters
    
    // Generate timestamp points based on interval and timeRange
    const now = new Date();
    const points = [];
    const totalPoints = parseInt(days || '1') * 24; // Default to 24 hours worth of data
    const intervalMs = interval === 'hourly' ? 3600000 : 60000; // hourly or minutely
    
    for (let i = 0; i < totalPoints; i++) {
      const timestamp = new Date(now.getTime() - (i * intervalMs));
      let value;
      
      // Generate realistic-looking data based on sensor type
      if (sensorType === 'temperature') {
        // Temperature between 20-25°C with some random fluctuation
        value = 22 + (Math.random() * 3);
      } else if (sensorType === 'humidity') {
        // Humidity between 40-60% with some random fluctuation
        value = 50 + (Math.random() * 10);
      } else if (sensorType === 'pressure') {
        // Pressure around 1013 hPa with some random fluctuation
        value = 1013 + (Math.random() * 5);
      } else {
        // Generic sensor data
        value = Math.random() * 100;
      }
      
      points.push({
        timestamp: timestamp.toISOString(),
        value: parseFloat(value.toFixed(2)),
        unit: sensorType === 'temperature' ? '°C' : 
              sensorType === 'humidity' ? '%' : 
              sensorType === 'pressure' ? 'hPa' : 'units'
      });
    }
    
    // Return the data
    return res.status(200).json({
      sensorType,
      interval,
      timeRange,
      days: parseInt(days || '1'),
      points: points.reverse() // Most recent first
    });
  } catch (error) {
    console.error('Error generating sensor data report:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Error generating sensor data report'
    });
  }
};

// Export the handler with CORS middleware, no authentication required
export default withApi(getSensorDataReport, { auth: false }); 