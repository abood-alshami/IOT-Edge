/**
 * Queue processors for handling different types of IoT data processing
 */
import { saveToDatabase } from './database.js';

/**
 * Process sensor data
 * Handles raw sensor readings and stores them in the database
 */
export const sensorDataProcessor = async ({ data }) => {
  try {
    // Save raw sensor data to database
    await saveToDatabase('sensor_data', {
      sensor_id: data.sensorId,
      value: Array.isArray(data.readings) ? data.readings[data.readings.length - 1] : data.value,
      unit: data.unit,
      timestamp: data.timestamp || new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error processing sensor data:', error);
    throw error; // Rethrow to trigger queue retry
  }
};

/**
 * Process analytics data
 * Performs statistical analysis on sensor readings
 */
export const analyticsProcessor = async ({ data }) => {
  try {
    if (!Array.isArray(data.readings) || data.readings.length === 0) {
      throw new Error('Invalid readings data');
    }

    // Calculate statistics
    const stats = {
      sensorId: data.sensorId,
      timestamp: data.timestamp,
      min: Math.min(...data.readings),
      max: Math.max(...data.readings),
      avg: data.readings.reduce((a, b) => a + b, 0) / data.readings.length,
      count: data.readings.length
    };

    // Save analytics results
    await saveToDatabase('sensor_analytics', stats);

    return { success: true, stats };
  } catch (error) {
    console.error('Error processing analytics:', error);
    throw error;
  }
};

/**
 * Process alerts
 * Handles alert generation and notification
 */
export const alertProcessor = async ({ data }) => {
  try {
    const alertData = {
      sensor_id: data.sensorId,
      type: data.type,
      message: `Sensor ${data.sensorId} readings exceeded ${data.type} threshold`,
      values: JSON.stringify(data.values),
      timestamp: data.timestamp,
      thresholds: JSON.stringify({
        critical: data.criticalThreshold,
        warning: data.warningThreshold
      })
    };

    // Save alert to database
    await saveToDatabase('sensor_alerts', alertData);

    // Here you would typically also:
    // 1. Send notifications (email, SMS, push notifications)
    // 2. Update alert status dashboards
    // 3. Trigger any automated responses

    return { success: true, alert: alertData };
  } catch (error) {
    console.error('Error processing alert:', error);
    throw error;
  }
};