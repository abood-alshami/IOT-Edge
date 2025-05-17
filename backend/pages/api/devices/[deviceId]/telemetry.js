/**
 * API endpoint for retrieving device telemetry data
 * 
 * Provides historical and real-time telemetry data from IoT devices
 * Version: 5.1.0 - May 12, 2025
 */

import { getDeviceTelemetry } from '../../../../utils/azure-iot.js';
import { formatError as handleApiError } from '../../../../utils/error-handler.js';
import { authenticate } from '../../../../middleware/auth.js';

// Default handler for the API endpoint
export default async function handler(req, res) {
  try {
    // Authentication middleware
    authenticate(req, res, async () => {
      try {
        // Get device ID from path params
        const { deviceId } = req.query;
        
        // Validate deviceId
        if (!deviceId) {
          return res.status(400).json({
            error: {
              code: 'MISSING_PARAMETER',
              message: 'Device ID is required'
            }
          });
        }
        
        // Handle different HTTP methods
        if (req.method === 'GET') {
          // Extract query parameters
          const { 
            type = null, 
            limit = 100,
            timespan = '24h',
            aggregate = null,
            interval = null
          } = req.query;
          
          // Parse numeric limit parameter
          const parsedLimit = parseInt(limit);
          if (isNaN(parsedLimit) || parsedLimit < 1) {
            return res.status(400).json({
              error: {
                code: 'INVALID_PARAMETER',
                message: 'Limit must be a positive number'
              }
            });
          }
          
          // Parse timespan parameter (e.g., 24h, 7d, 30d)
          let timespanMs = 24 * 60 * 60 * 1000; // Default: 24 hours
          if (timespan) {
            const value = parseInt(timespan);
            const unit = timespan.slice(-1).toLowerCase();
            
            if (!isNaN(value) && value > 0) {
              switch (unit) {
                case 's':
                  timespanMs = value * 1000; // seconds
                  break;
                case 'm':
                  timespanMs = value * 60 * 1000; // minutes
                  break;
                case 'h':
                  timespanMs = value * 60 * 60 * 1000; // hours
                  break;
                case 'd':
                  timespanMs = value * 24 * 60 * 60 * 1000; // days
                  break;
                case 'w':
                  timespanMs = value * 7 * 24 * 60 * 60 * 1000; // weeks
                  break;
                default:
                  timespanMs = value;
              }
            }
          }
          
          try {
            // Get telemetry readings from database or fallback to cache
            const readings = await getDeviceTelemetry(deviceId, type, parsedLimit);
            
            // Filter readings by timespan if needed
            const now = new Date();
            const startTime = new Date(now.getTime() - timespanMs);
            
            const filteredReadings = readings.filter(reading => {
              const readingTime = new Date(reading.timestamp);
              return readingTime >= startTime && readingTime <= now;
            });
            
            // Process readings if aggregation is requested
            let processedReadings = filteredReadings;
            
            if (aggregate && interval) {
              // Implement simple aggregation logic
              // This is a basic implementation - in a real system, 
              // you might use a time-series database or analytics service
              const aggregatedReadings = aggregateReadings(
                filteredReadings,
                aggregate,
                interval,
                startTime,
                now
              );
              
              processedReadings = aggregatedReadings;
            }
            
            // Return the telemetry data
            return res.status(200).json({
              deviceId,
              count: processedReadings.length,
              timespan: timespan,
              type: type,
              readings: processedReadings,
              _metadata: {
                aggregation: aggregate || 'none',
                interval: interval,
                startTime: startTime.toISOString(),
                endTime: now.toISOString()
              }
            });
          } catch (error) {
            return handleApiError(error, `retrieving telemetry for device ${deviceId}`, req, res);
          }
        } else if (req.method === 'POST') {
          return res.status(501).json({
            error: {
              code: 'NOT_IMPLEMENTED',
              message: 'Posting telemetry through this endpoint is not yet implemented. Use the sensor-data endpoint instead.'
            }
          });
        } else {
          // Method not allowed
          return res.status(405).json({
            error: {
              code: 'METHOD_NOT_ALLOWED',
              message: `HTTP method ${req.method} not allowed for this endpoint`
            }
          });
        }
      } catch (error) {
        return handleApiError(error, 'processing telemetry request', req, res);
      }
    });
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error in telemetry API:', error);
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
}

/**
 * Aggregate readings based on specified function and interval
 * @param {Array} readings - Telemetry readings to aggregate
 * @param {string} aggregateFunction - Aggregation function (avg, min, max, sum, count)
 * @param {string} interval - Time interval for aggregation (e.g., 5m, 1h)
 * @param {Date} startTime - Start time for aggregation
 * @param {Date} endTime - End time for aggregation
 * @returns {Array} - Aggregated readings
 */
const aggregateReadings = (readings, aggregateFunction, interval, startTime, endTime) => {
  if (!readings || readings.length === 0) {
    return [];
  }
  
  // Parse interval
  const intervalValue = parseInt(interval);
  const intervalUnit = interval.slice(-1).toLowerCase();
  
  // Calculate interval in milliseconds
  let intervalMs = 60 * 1000; // Default: 1 minute
  
  switch (intervalUnit) {
    case 's':
      intervalMs = intervalValue * 1000; // seconds
      break;
    case 'm':
      intervalMs = intervalValue * 60 * 1000; // minutes
      break;
    case 'h':
      intervalMs = intervalValue * 60 * 60 * 1000; // hours
      break;
    case 'd':
      intervalMs = intervalValue * 24 * 60 * 60 * 1000; // days
      break;
    default:
      intervalMs = intervalValue * 60 * 1000; // default to minutes
  }
  
  // Generate time buckets
  const buckets = [];
  let currentTime = startTime.getTime();
  
  while (currentTime < endTime.getTime()) {
    buckets.push({
      startTime: new Date(currentTime),
      endTime: new Date(currentTime + intervalMs),
      readings: []
    });
    
    currentTime += intervalMs;
  }
  
  // Assign readings to buckets
  for (const reading of readings) {
    const readingTime = new Date(reading.timestamp).getTime();
    
    for (const bucket of buckets) {
      if (readingTime >= bucket.startTime.getTime() && readingTime < bucket.endTime.getTime()) {
        bucket.readings.push(reading);
        break;
      }
    }
  }
  
  // Apply aggregation function to each bucket
  return buckets.map(bucket => {
    if (bucket.readings.length === 0) {
      return null;
    }
    
    const aggregatedValue = calculateAggregation(bucket.readings, aggregateFunction);
    return {
      timestamp: bucket.startTime.toISOString(),
      timestampEnd: bucket.endTime.toISOString(),
      value: aggregatedValue,
      count: bucket.readings.length,
      aggregation: aggregateFunction,
      interval: interval
    };
  }).filter(reading => reading !== null);
};

/**
 * Calculate aggregation value based on specified function
 * @param {Array} readings - Readings to aggregate
 * @param {string} aggregateFunction - Aggregation function
 * @returns {number} - Aggregated value
 */
const calculateAggregation = (readings, aggregateFunction) => {
  // Extract numerical values from readings
  const values = readings
    .map(reading => parseFloat(reading.value))
    .filter(value => !isNaN(value));
  
  if (values.length === 0) {
    return null;
  }
  
  switch (aggregateFunction.toLowerCase()) {
    case 'avg':
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'sum':
      return values.reduce((sum, value) => sum + value, 0);
    case 'count':
      return values.length;
    default:
      return values[0]; // Default to first value
  }
};