/**
 * Telemetry Processing Service
 * Processes IoT device telemetry data, stores it, and triggers events
 * Version: 5.1.0 - May 12, 2025
 */

import { EventEmitter } from 'events';
import dotenv from 'dotenv';
import { saveToDatabase } from './database.js';

// Initialize environment variables
dotenv.config();

// Create event emitter for broadcasting telemetry events
class TelemetryProcessor extends EventEmitter {
  constructor() {
    super();
    this.initialized = false;
    this.telemetryCache = new Map(); // Cache of latest telemetry by deviceId
    this.alertThresholds = new Map(); // Alert thresholds by sensor type
    
    // Default alert thresholds
    this.defaultThresholds = {
      temperature: { min: -10, max: 50, unit: '°C' },
      humidity: { min: 20, max: 80, unit: '%' },
      pressure: { min: 900, max: 1100, unit: 'hPa' },
      co2: { min: 0, max: 1000, unit: 'ppm' },
      voc: { min: 0, max: 500, unit: 'ppb' },
      particulate: { min: 0, max: 50, unit: 'µg/m³' },
      voltage: { min: 220, max: 240, unit: 'V' },
      current: { min: 0, max: 16, unit: 'A' },
      power: { min: 0, max: 3600, unit: 'W' },
      energy: { min: 0, max: 100000, unit: 'kWh' },
      motion: { min: 0, max: 1, unit: 'boolean' },
      door: { min: 0, max: 1, unit: 'boolean' },
      water: { min: 0, max: 1, unit: 'boolean' },
      smoke: { min: 0, max: 1, unit: 'boolean' },
      default: { min: 0, max: 100, unit: '' }
    };
  }
  
  /**
   * Initialize the telemetry processor
   * @returns {Promise<boolean>} Success status
   */
  async initTelemetryProcessor() {
    try {
      console.log('Initializing telemetry processor...');
      
      // Load alert thresholds from database
      try {
        const { query } = await import('./database.js');
        const thresholds = await query('SELECT * FROM alert_thresholds');
        
        // If we have thresholds in the database, use them
        if (thresholds && thresholds.length > 0) {
          thresholds.forEach(threshold => {
            this.alertThresholds.set(threshold.sensor_type, {
              min: threshold.min_value,
              max: threshold.max_value,
              unit: threshold.unit
            });
          });
          console.log(`Loaded ${this.alertThresholds.size} alert thresholds from database`);
        } else {
          // Otherwise use defaults
          console.log('No alert thresholds found in database, using defaults');
          Object.entries(this.defaultThresholds).forEach(([type, thresholds]) => {
            this.alertThresholds.set(type, thresholds);
          });
        }
      } catch (error) {
        console.warn('Error loading alert thresholds from database:', error.message);
        console.log('Using default alert thresholds');
        
        // Set default thresholds
        Object.entries(this.defaultThresholds).forEach(([type, thresholds]) => {
          this.alertThresholds.set(type, thresholds);
        });
      }
      
      this.initialized = true;
      console.log('Telemetry processor initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing telemetry processor:', error);
      return false;
    }
  }
  
  /**
   * Add telemetry data to the processor
   * @param {Object} telemetryData - Telemetry data to process
   * @returns {Promise<boolean>} Success status
   */
  async addTelemetry(telemetryData) {
    if (!this.initialized) {
      await this.initTelemetryProcessor();
    }
    
    try {
      // Basic validation
      if (!telemetryData || typeof telemetryData !== 'object') {
        console.error('Invalid telemetry data format');
        return false;
      }
      
      // If an array of readings, process each one
      if (Array.isArray(telemetryData)) {
        for (const reading of telemetryData) {
          await this.processTelemetryReading(reading);
        }
        return true;
      }
      
      // Process single reading
      await this.processTelemetryReading(telemetryData);
      return true;
    } catch (error) {
      console.error('Error processing telemetry data:', error);
      return false;
    }
  }
  
  /**
   * Process a single telemetry reading
   * @param {Object} reading - Telemetry reading to process
   * @returns {Promise<boolean>} Success status
   */
  async processTelemetryReading(reading) {
    try {
      // Extract reading data
      const { 
        deviceId, 
        sensorId = deviceId, // Fall back to deviceId if sensorId not provided
        type, 
        value, 
        unit, 
        timestamp = new Date().toISOString() 
      } = reading;
      
      // Validate required fields
      if (!sensorId || value === undefined || value === null) {
        console.error('Invalid reading format, missing required fields');
        return false;
      }
      
      // Store in cache
      this.telemetryCache.set(sensorId, {
        ...reading,
        timestamp: timestamp
      });
      
      // Emit telemetry event
      this.emit('new-telemetry', reading);
      
      // Save to database
      try {
        const telemetryId = await saveToDatabase('sensor_data', {
          sensor_id: sensorId,
          value: value,
          unit: unit || '',
          timestamp: timestamp
        });
        
        // Add ID to reading
        if (telemetryId) {
          reading.id = telemetryId;
        }
      } catch (dbError) {
        console.warn('Failed to save telemetry to database:', dbError.message);
        // Continue processing, don't fail the whole process
      }
      
      // Check alerts
      this.checkAlerts(reading);
      
      return true;
    } catch (error) {
      console.error('Error processing telemetry reading:', error);
      return false;
    }
  }
  
  /**
   * Check if a reading should trigger an alert
   * @param {Object} reading - Telemetry reading to check
   */
  checkAlerts(reading) {
    try {
      const { sensorId, deviceId, type, value } = reading;
      const id = sensorId || deviceId;
      
      // Skip alert check if no type or value
      if (!type || value === undefined || value === null) {
        return;
      }
      
      // Get relevant threshold
      const threshold = this.alertThresholds.get(type) || this.alertThresholds.get('default');
      
      // Skip if no threshold
      if (!threshold) {
        return;
      }
      
      // Check against threshold
      if (value < threshold.min || value > threshold.max) {
        const alertLevel = value < threshold.min ? 'low' : 'high';
        const alert = {
          sensorId: id,
          type: type,
          value: value,
          threshold: threshold,
          alertLevel: alertLevel,
          message: `${type} value ${value} ${threshold.unit} is ${alertLevel === 'low' ? 'below' : 'above'} threshold (${alertLevel === 'low' ? threshold.min : threshold.max} ${threshold.unit})`,
          timestamp: new Date().toISOString()
        };
        
        // Emit alert event
        this.emit('alert', alert);
        
        // Log alert
        console.log(`ALERT: ${alert.message}`);
        
        // Save to database
        try {
          saveToDatabase('alerts', {
            sensor_id: id,
            type: type,
            value: value,
            threshold_min: threshold.min,
            threshold_max: threshold.max,
            alert_level: alertLevel,
            message: alert.message,
            timestamp: alert.timestamp
          });
        } catch (dbError) {
          console.warn('Failed to save alert to database:', dbError.message);
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }
  
  /**
   * Get the latest readings for a device
   * @param {string} deviceId - Device ID to get readings for
   * @returns {Array} Latest readings
   */
  getLatestReadings(deviceId) {
    if (!deviceId) {
      // If no device ID specified, return all readings
      return Array.from(this.telemetryCache.values());
    }
    
    // Get reading for specific device
    const reading = this.telemetryCache.get(deviceId);
    return reading ? [reading] : [];
  }
  
  /**
   * Update alert thresholds
   * @param {string} sensorType - Sensor type
   * @param {number} min - Minimum threshold
   * @param {number} max - Maximum threshold
   * @param {string} unit - Unit of measurement
   * @returns {boolean} Success status
   */
  updateAlertThreshold(sensorType, min, max, unit) {
    if (!sensorType) {
      return false;
    }
    
    // Update threshold
    this.alertThresholds.set(sensorType, {
      min: min,
      max: max,
      unit: unit || ''
    });
    
    // Try to update in database
    try {
      saveToDatabase('alert_thresholds', {
        sensor_type: sensorType,
        min_value: min,
        max_value: max,
        unit: unit || ''
      });
      
      // Emit system event
      this.emit('system-event', {
        type: 'threshold-update',
        sensorType: sensorType,
        min: min,
        max: max,
        unit: unit,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating alert threshold in database:', error);
      return false;
    }
  }
  
  /**
   * Clean up resources
   * @returns {Promise<boolean>} Success status
   */
  async cleanup() {
    try {
      console.log('Cleaning up telemetry processor...');
      
      // Emit system event for shutdown
      this.emit('system-event', {
        type: 'processor-shutdown',
        message: 'Telemetry processor shutting down',
        timestamp: new Date().toISOString()
      });
      
      // Clear cache
      this.telemetryCache.clear();
      
      // Remove all listeners
      this.removeAllListeners();
      
      console.log('Telemetry processor cleaned up successfully');
      return true;
    } catch (error) {
      console.error('Error cleaning up telemetry processor:', error);
      return false;
    }
  }
}

// Create singleton instance
const telemetryProcessor = new TelemetryProcessor();

export default telemetryProcessor;