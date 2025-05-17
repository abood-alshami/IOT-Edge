/**
 * Local IoT Implementation
 * A replacement for Azure IoT Hub functionality
 * Created: May 12, 2025
 * Version: 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import mqtt from 'mqtt';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import pkg from '../../config.js';
const { iot: iotConfig } = pkg;

/**
 * Local IoT implementation class
 * Provides functionality similar to Azure IoT Hub but using local storage and MQTT
 */
class LocalIoT {
  constructor() {
    this.mqttClient = null;
    this.devices = {};
    this.isConnected = false;
    this.dataDir = iotConfig.dataDir;
    this.telemetryDir = path.join(this.dataDir, 'telemetry');
    this.devicesFile = path.join(this.dataDir, 'devices.json');
    this.clientId = iotConfig.mqtt.clientId;
    this.initPromise = this.initialize();
    this.messageCallbacks = new Map();
  }

  /**
   * Initialize the LocalIoT service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Ensure data directories exist
      await this.ensureDirectories();
      
      // Load devices from file
      await this.loadDevices();
      
      // Connect to MQTT broker
      await this.connectMqtt();
      
      console.log('LocalIoT service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LocalIoT service:', error);
      throw error;
    }
  }

  /**
   * Ensure required directories exist
   * @returns {Promise<void>}
   */
  async ensureDirectories() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(this.telemetryDir, { recursive: true });
      console.log('Data directories created');
    } catch (error) {
      console.error('Error creating directories:', error);
      throw error;
    }
  }

  /**
   * Load devices from the devices file
   * @returns {Promise<void>}
   */
  async loadDevices() {
    try {
      try {
        const data = await fs.readFile(this.devicesFile, 'utf8');
        const parsed = JSON.parse(data);
        this.devices = {};
        
        // Convert array to object with deviceId as key
        if (Array.isArray(parsed.devices)) {
          parsed.devices.forEach(device => {
            this.devices[device.deviceId] = device;
          });
        }
        
        console.log(`Loaded ${Object.keys(this.devices).length} devices`);
      } catch (readError) {
        if (readError.code === 'ENOENT') {
          // Create empty devices file if it doesn't exist
          await fs.writeFile(this.devicesFile, JSON.stringify({ devices: [] }));
          console.log('Created empty devices file');
        } else {
          throw readError;
        }
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      throw error;
    }
  }

  /**
   * Save devices to the devices file
   * @returns {Promise<void>}
   */
  async saveDevices() {
    try {
      const deviceArray = Object.values(this.devices);
      await fs.writeFile(
        this.devicesFile,
        JSON.stringify({ devices: deviceArray }, null, 2)
      );
    } catch (error) {
      console.error('Error saving devices:', error);
      throw error;
    }
  }

  /**
   * Connect to MQTT broker
   * @returns {Promise<void>}
   */
  async connectMqtt() {
    return new Promise((resolve, reject) => {
      try {
        const options = {
          clientId: this.clientId,
          clean: true,
          reconnectPeriod: 5000,
        };
        
        if (iotConfig.mqtt.username && iotConfig.mqtt.password) {
          options.username = iotConfig.mqtt.username;
          options.password = iotConfig.mqtt.password;
        }
        
        this.mqttClient = mqtt.connect(iotConfig.mqtt.brokerUrl, options);
        
        this.mqttClient.on('connect', () => {
          console.log(`Connected to MQTT broker at ${iotConfig.mqtt.brokerUrl}`);
          this.isConnected = true;
          
          // Subscribe to device topics
          this.mqttClient.subscribe('devices/+/telemetry');
          this.mqttClient.subscribe('devices/+/status');
          this.mqttClient.subscribe('devices/+/properties/reported');
          
          resolve();
        });
        
        this.mqttClient.on('error', (error) => {
          console.error('MQTT connection error:', error);
          this.isConnected = false;
          reject(error);
        });
        
        this.mqttClient.on('message', this.handleMessage.bind(this));
        
        this.mqttClient.on('close', () => {
          console.log('MQTT connection closed');
          this.isConnected = false;
        });
      } catch (error) {
        console.error('Error connecting to MQTT broker:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming MQTT messages
   * @param {string} topic - MQTT topic
   * @param {Buffer} message - Message payload
   */
  async handleMessage(topic, message) {
    try {
      // Parse the message
      const payload = JSON.parse(message.toString());
      
      // Extract deviceId from topic
      const deviceIdMatch = topic.match(/devices\/([^/]+)/);
      if (!deviceIdMatch) {
        console.warn(`Invalid topic format: ${topic}`);
        return;
      }
      
      const deviceId = deviceIdMatch[1];
      
      // Handle different message types based on topic
      if (topic.endsWith('/telemetry')) {
        await this.handleTelemetry(deviceId, payload);
      } else if (topic.endsWith('/status')) {
        await this.handleStatus(deviceId, payload);
      } else if (topic.endsWith('/properties/reported')) {
        await this.handleReportedProperties(deviceId, payload);
      }
      
      // Notify any registered callbacks
      this.notifyMessageCallbacks(deviceId, topic, payload);
    } catch (error) {
      console.error('Error handling MQTT message:', error);
    }
  }

  /**
   * Handle device telemetry data
   * @param {string} deviceId - Device ID
   * @param {Object} payload - Telemetry data
   */
  async handleTelemetry(deviceId, payload) {
    try {
      // Ensure device exists
      if (!this.devices[deviceId]) {
        console.warn(`Received telemetry from unknown device: ${deviceId}`);
        return;
      }
      
      // Update device last activity time
      this.devices[deviceId].lastActivityTime = new Date().toISOString();
      
      // Save telemetry data
      const deviceDir = path.join(this.telemetryDir, deviceId);
      await fs.mkdir(deviceDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = path.join(deviceDir, `${timestamp}.json`);
      
      await fs.writeFile(filename, JSON.stringify(payload, null, 2));
      
      // Clean up old telemetry data (async, don't await)
      this.cleanupOldTelemetry(deviceId).catch(err => {
        console.error(`Error cleaning up telemetry for ${deviceId}:`, err);
      });
      
      // Save updated device state
      await this.saveDevices();
    } catch (error) {
      console.error(`Error handling telemetry for ${deviceId}:`, error);
    }
  }

  /**
   * Handle device status updates
   * @param {string} deviceId - Device ID
   * @param {Object} payload - Status data
   */
  async handleStatus(deviceId, payload) {
    try {
      if (!this.devices[deviceId]) {
        // Create device if it doesn't exist
        this.devices[deviceId] = {
          deviceId,
          status: 'enabled',
          authentication: {
            type: 'sas',
            symmetricKey: {
              primaryKey: crypto.randomBytes(32).toString('base64'),
              secondaryKey: crypto.randomBytes(32).toString('base64')
            }
          },
          connectionState: payload.connectionState || 'disconnected',
          desiredProperties: {},
          reportedProperties: {},
          lastActivityTime: new Date().toISOString()
        };
        
        console.log(`Created new device: ${deviceId}`);
      } else {
        // Update existing device
        this.devices[deviceId].connectionState = payload.connectionState || this.devices[deviceId].connectionState;
        this.devices[deviceId].lastActivityTime = new Date().toISOString();
      }
      
      // Save updated device state
      await this.saveDevices();
    } catch (error) {
      console.error(`Error handling status for ${deviceId}:`, error);
    }
  }

  /**
   * Handle device reported properties
   * @param {string} deviceId - Device ID
   * @param {Object} payload - Reported properties
   */
  async handleReportedProperties(deviceId, payload) {
    try {
      if (!this.devices[deviceId]) {
        console.warn(`Received properties from unknown device: ${deviceId}`);
        return;
      }
      
      // Update reported properties
      this.devices[deviceId].reportedProperties = {
        ...this.devices[deviceId].reportedProperties,
        ...payload
      };
      
      // Update last activity time
      this.devices[deviceId].lastActivityTime = new Date().toISOString();
      
      // Save updated device state
      await this.saveDevices();
    } catch (error) {
      console.error(`Error handling reported properties for ${deviceId}:`, error);
    }
  }

  /**
   * Clean up old telemetry data
   * @param {string} deviceId - Device ID
   */
  async cleanupOldTelemetry(deviceId) {
    try {
      const deviceDir = path.join(this.telemetryDir, deviceId);
      
      // Get all telemetry files
      const files = await fs.readdir(deviceDir);
      
      // Calculate cutoff date
      const now = new Date();
      const cutoff = new Date(now.getTime() - (iotConfig.telemetry.retentionDays * 24 * 60 * 60 * 1000));
      
      // Delete files older than cutoff
      for (const file of files) {
        try {
          const filePath = path.join(deviceDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoff) {
            await fs.unlink(filePath);
          }
        } catch (err) {
          console.error(`Error processing file ${file}:`, err);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up telemetry for ${deviceId}:`, error);
    }
  }

  /**
   * Register a callback for message notifications
   * @param {string} deviceId - Device ID
   * @param {function} callback - Callback function
   * @returns {string} Callback ID
   */
  registerMessageCallback(deviceId, callback) {
    const callbackId = uuidv4();
    this.messageCallbacks.set(callbackId, { deviceId, callback });
    return callbackId;
  }

  /**
   * Unregister a message callback
   * @param {string} callbackId - Callback ID
   */
  unregisterMessageCallback(callbackId) {
    this.messageCallbacks.delete(callbackId);
  }

  /**
   * Notify registered callbacks of a message
   * @param {string} deviceId - Device ID
   * @param {string} topic - Message topic
   * @param {Object} payload - Message payload
   */
  notifyMessageCallbacks(deviceId, topic, payload) {
    for (const [id, { deviceId: cbDeviceId, callback }] of this.messageCallbacks.entries()) {
      if (cbDeviceId === deviceId || cbDeviceId === '*') {
        try {
          callback(deviceId, topic, payload);
        } catch (error) {
          console.error(`Error in message callback ${id}:`, error);
        }
      }
    }
  }

  /**
   * Get all devices
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} List of devices
   */
  async getDevices(options = {}) {
    await this.initPromise;
    
    let deviceList = Object.values(this.devices);
    
    // Apply filters
    if (options.status) {
      deviceList = deviceList.filter(device => device.status === options.status);
    }
    
    if (options.location) {
      deviceList = deviceList.filter(device => {
        const location = device.desiredProperties?.location || device.reportedProperties?.location;
        return location === options.location;
      });
    }
    
    if (options.type) {
      deviceList = deviceList.filter(device => device.type === options.type);
    }
    
    if (options.query) {
      const query = options.query.toLowerCase();
      deviceList = deviceList.filter(device => {
        return device.deviceId.toLowerCase().includes(query) ||
               (device.type && device.type.toLowerCase().includes(query)) ||
               (device.desiredProperties?.location && device.desiredProperties.location.toLowerCase().includes(query));
      });
    }
    
    // Apply limits
    const maxResults = options.maxResults ? parseInt(options.maxResults, 10) : undefined;
    if (maxResults) {
      deviceList = deviceList.slice(0, maxResults);
    }
    
    return deviceList;
  }

  /**
   * Get a device by ID
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object>} Device object
   */
  async getDevice(deviceId) {
    await this.initPromise;
    
    const device = this.devices[deviceId];
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    
    return device;
  }

  /**
   * Create or update a device
   * @param {string} deviceId - Device ID
   * @param {Object} deviceInfo - Device information
   * @returns {Promise<Object>} Created or updated device
   */
  async createOrUpdateDevice(deviceId, deviceInfo) {
    await this.initPromise;
    
    const existing = this.devices[deviceId];
    
    const device = {
      deviceId,
      status: deviceInfo.status || (existing?.status || 'enabled'),
      authentication: deviceInfo.authentication || (existing?.authentication || {
        type: 'sas',
        symmetricKey: {
          primaryKey: crypto.randomBytes(32).toString('base64'),
          secondaryKey: crypto.randomBytes(32).toString('base64')
        }
      }),
      connectionState: existing?.connectionState || 'disconnected',
      desiredProperties: {
        ...(existing?.desiredProperties || {}),
        ...(deviceInfo.desiredProperties || {})
      },
      reportedProperties: {
        ...(existing?.reportedProperties || {}),
        ...(deviceInfo.reportedProperties || {})
      },
      lastActivityTime: existing?.lastActivityTime || new Date().toISOString(),
      type: deviceInfo.type || existing?.type
    };
    
    this.devices[deviceId] = device;
    
    // Save updated device state
    await this.saveDevices();
    
    return device;
  }

  /**
   * Delete a device
   * @param {string} deviceId - Device ID
   * @returns {Promise<void>}
   */
  async deleteDevice(deviceId) {
    await this.initPromise;
    
    if (!this.devices[deviceId]) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    
    delete this.devices[deviceId];
    
    // Save updated device state
    await this.saveDevices();
    
    // Clean up device telemetry (optional)
    const deviceDir = path.join(this.telemetryDir, deviceId);
    try {
      await fs.rm(deviceDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Error deleting telemetry for ${deviceId}:`, error);
    }
  }

  /**
   * Get device twin
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object>} Device twin
   */
  async getDeviceTwin(deviceId) {
    await this.initPromise;
    
    const device = this.devices[deviceId];
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    
    return {
      deviceId,
      etag: crypto.createHash('md5').update(JSON.stringify(device)).digest('hex'),
      properties: {
        desired: device.desiredProperties || {},
        reported: device.reportedProperties || {}
      },
      status: device.status,
      lastActivityTime: device.lastActivityTime,
      connectionState: device.connectionState
    };
  }

  /**
   * Update device twin desired properties
   * @param {string} deviceId - Device ID
   * @param {Object} properties - Desired properties
   * @returns {Promise<Object>} Updated device twin
   */
  async updateDeviceTwinProperties(deviceId, properties) {
    await this.initPromise;
    
    const device = this.devices[deviceId];
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    
    // Update desired properties
    device.desiredProperties = {
      ...device.desiredProperties,
      ...properties
    };
    
    // Save updated device state
    await this.saveDevices();
    
    // Publish desired properties to device
    if (this.isConnected) {
      const topic = `devices/${deviceId}/properties/desired`;
      this.mqttClient.publish(topic, JSON.stringify(properties));
    }
    
    return await this.getDeviceTwin(deviceId);
  }

  /**
   * Invoke a direct method on a device
   * @param {string} deviceId - Device ID
   * @param {string} methodName - Method name
   * @param {Object} payload - Method payload
   * @param {number} responseTimeout - Response timeout in seconds
   * @returns {Promise<Object>} Method response
   */
  async invokeDeviceMethod(deviceId, methodName, payload, responseTimeout = 30) {
    await this.initPromise;
    
    const device = this.devices[deviceId];
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    
    if (device.connectionState !== 'connected') {
      throw new Error(`Device is not connected: ${deviceId}`);
    }
    
    return new Promise((resolve, reject) => {
      // Generate a unique request ID
      const requestId = uuidv4();
      
      // Set up response topic
      const responseTopic = `devices/${deviceId}/methods/response/${requestId}`;
      
      // Set up timeout
      const timeout = setTimeout(() => {
        this.mqttClient.unsubscribe(responseTopic);
        reject(new Error(`Method invocation timed out after ${responseTimeout} seconds`));
      }, responseTimeout * 1000);
      
      // Set up one-time response handler
      this.mqttClient.subscribe(responseTopic);
      
      const handleResponse = (topic, message) => {
        if (topic === responseTopic) {
          try {
            // Clear timeout
            clearTimeout(timeout);
            
            // Unsubscribe from response topic
            this.mqttClient.unsubscribe(responseTopic);
            
            // Remove listener
            this.mqttClient.removeListener('message', handleResponse);
            
            // Parse response
            const response = JSON.parse(message.toString());
            
            resolve(response);
          } catch (error) {
            reject(error);
          }
        }
      };
      
      // Add response listener
      this.mqttClient.on('message', handleResponse);
      
      // Publish method request
      const requestTopic = `devices/${deviceId}/methods/request/${methodName}`;
      const requestPayload = {
        requestId,
        methodName,
        payload
      };
      
      this.mqttClient.publish(requestTopic, JSON.stringify(requestPayload));
    });
  }

  /**
   * Send a cloud-to-device message
   * @param {string} deviceId - Device ID
   * @param {Object|string} message - Message payload
   * @param {Object} properties - Message properties
   * @returns {Promise<Object>} Response data
   */
  async sendC2DMessage(deviceId, message, properties = {}) {
    await this.initPromise;
    
    const device = this.devices[deviceId];
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    
    // Generate message ID
    const messageId = uuidv4();
    
    // Prepare message
    const messageData = {
      messageId,
      payload: message,
      properties,
      timestamp: new Date().toISOString()
    };
    
    // Publish message
    const topic = `devices/${deviceId}/messages/devicebound`;
    this.mqttClient.publish(topic, JSON.stringify(messageData));
    
    return {
      messageId,
      status: 'enqueued',
      deviceId
    };
  }

  /**
   * Get device telemetry data
   * @param {string} deviceId - Device ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Telemetry data
   */
  async getDeviceTelemetry(deviceId, options = {}) {
    await this.initPromise;
    
    const device = this.devices[deviceId];
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    
    try {
      const deviceDir = path.join(this.telemetryDir, deviceId);
      
      // Ensure device telemetry directory exists
      try {
        await fs.mkdir(deviceDir, { recursive: true });
      } catch (err) {
        // Ignore if directory already exists
      }
      
      // Get all telemetry files
      const files = await fs.readdir(deviceDir);
      
      // Filter and sort files by creation time (descending)
      let telemetryFiles = await Promise.all(files.map(async file => {
        const filePath = path.join(deviceDir, file);
        const stats = await fs.stat(filePath);
        return {
          path: filePath,
          name: file,
          time: stats.mtime.getTime(),
          size: stats.size
        };
      }));
      
      // Sort by time (newest first)
      telemetryFiles.sort((a, b) => b.time - a.time);
      
      // Apply time filters if specified
      if (options.startTime) {
        const startTime = new Date(options.startTime).getTime();
        telemetryFiles = telemetryFiles.filter(file => file.time >= startTime);
      }
      
      if (options.endTime) {
        const endTime = new Date(options.endTime).getTime();
        telemetryFiles = telemetryFiles.filter(file => file.time <= endTime);
      }
      
      // Apply limit if specified
      const limit = options.limit ? parseInt(options.limit, 10) : 100;
      telemetryFiles = telemetryFiles.slice(0, limit);
      
      // Read telemetry data from files
      const telemetryData = await Promise.all(telemetryFiles.map(async file => {
        try {
          const data = await fs.readFile(file.path, 'utf8');
          return JSON.parse(data);
        } catch (err) {
          console.error(`Error reading telemetry file ${file.path}:`, err);
          return null;
        }
      }));
      
      // Filter out null values and apply type filter
      return telemetryData.filter(data => {
        if (!data) return false;
        
        if (options.types) {
          const types = Array.isArray(options.types) ? options.types : options.types.split(',');
          
          // Check if data has any of the requested types
          return types.some(type => data[type] !== undefined);
        }
        
        return true;
      });
    } catch (error) {
      console.error(`Error getting telemetry for ${deviceId}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
const localIoT = new LocalIoT();

export default localIoT;