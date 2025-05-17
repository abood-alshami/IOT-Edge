/**
 * Azure IoT Hub integration utility
 * Handles connection to Azure IoT Hub and device management
 * Version: 5.1.0 - May 12, 2025
 */

import { Registry, Client } from 'azure-iothub';
import { clientFromConnectionString } from 'azure-iot-device-mqtt';
import { Message } from 'azure-iot-device';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Azure IoT Hub connection settings
const connectionString = process.env.AZURE_IOTHUB_CONNECTION_STRING || '';
const registry = connectionString ? Registry.fromConnectionString(connectionString) : null;

// Connection cache for device clients
const deviceClients = new Map();

/**
 * List all devices registered in the IoT Hub
 * @returns {Promise<Array>} List of devices
 */
const listDevices = async () => {
  if (!registry) {
    throw new Error('Azure IoT Hub connection string not configured');
  }
  
  try {
    const queryResult = await registry.createQuery(
      'SELECT * FROM devices', 
      { numberOfResults: 1000 }
    ).nextAsTwin();
    
    return queryResult.map(deviceTwin => ({
      deviceId: deviceTwin.deviceId,
      status: deviceTwin.connectionState,
      lastActivityTime: deviceTwin.lastActivityTime,
      type: deviceTwin.properties?.reported?.type || 'unknown',
      firmware: deviceTwin.properties?.reported?.firmware,
      lastTelemetry: deviceTwin.properties?.reported?.lastTelemetry,
      location: deviceTwin.properties?.reported?.location
    }));
  } catch (error) {
    console.error('Error fetching devices from IoT Hub:', error);
    throw error;
  }
};

/**
 * Get device details by ID
 * @param {string} deviceId Device ID
 * @returns {Promise<Object>} Device details
 */
const getDevice = async (deviceId) => {
  if (!registry) {
    throw new Error('Azure IoT Hub connection string not configured');
  }
  
  try {
    const device = await registry.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }
    
    // Get device twin for additional details
    const twin = await registry.getTwin(deviceId);
    
    return {
      deviceId: device.deviceId,
      connectionState: twin.connectionState,
      status: twin.status,
      statusReason: twin.statusReason,
      lastActivityTime: twin.lastActivityTime,
      properties: {
        desired: twin.properties.desired,
        reported: twin.properties.reported
      }
    };
  } catch (error) {
    console.error(`Error fetching device ${deviceId}:`, error);
    throw error;
  }
};

/**
 * Invoke a direct method on a device
 * @param {string} deviceId - Target device ID
 * @param {string} methodName - Method name to invoke
 * @param {Object} payload - Method parameters
 * @param {number} timeout - Timeout in seconds
 * @returns {Promise<Object>} Method response
 */
const invokeDeviceMethod = async (deviceId, methodName, payload, timeout = 30) => {
  if (!registry) {
    throw new Error('Azure IoT Hub connection string not configured');
  }
  
  // Create service client
  const serviceClient = Client.fromConnectionString(connectionString);
  
  const methodParams = {
    methodName: methodName,
    payload: payload,
    responseTimeoutInSeconds: timeout
  };
  
  try {
    console.log(`Invoking method ${methodName} on device ${deviceId}`);
    const result = await serviceClient.invokeDeviceMethod(deviceId, methodParams);
    console.log(`Method ${methodName} invoked successfully`);
    return result;
  } catch (error) {
    console.error(`Error invoking method ${methodName} on device ${deviceId}:`, error);
    throw error;
  } finally {
    serviceClient.close();
  }
};

/**
 * Send a cloud-to-device message
 * @param {string} deviceId - Target device ID
 * @param {Object} messageData - Message data
 * @returns {Promise<boolean>} Success status
 */
const sendCloudToDeviceMessage = async (deviceId, messageData) => {
  if (!connectionString) {
    throw new Error('Azure IoT Hub connection string not configured');
  }
  
  const serviceClient = Client.fromConnectionString(connectionString);
  
  try {
    const message = new Message(JSON.stringify(messageData));
    message.contentType = 'application/json';
    message.contentEncoding = 'utf-8';
    
    await serviceClient.send(deviceId, message);
    console.log(`Cloud-to-device message sent to device ${deviceId}`);
    return true;
  } catch (error) {
    console.error(`Error sending message to device ${deviceId}:`, error);
    throw error;
  } finally {
    serviceClient.close();
  }
};

/**
 * Update device twin properties
 * @param {string} deviceId - Device ID
 * @param {Object} properties - Properties to update
 * @returns {Promise<Object>} Updated twin
 */
const updateDeviceTwin = async (deviceId, properties) => {
  if (!registry) {
    throw new Error('Azure IoT Hub connection string not configured');
  }
  
  try {
    const twin = await registry.getTwin(deviceId);
    twin.properties.desired = {
      ...twin.properties.desired,
      ...properties
    };
    
    const result = await registry.updateTwin(deviceId, twin, twin.etag);
    console.log(`Device twin updated for ${deviceId}`);
    return result;
  } catch (error) {
    console.error(`Error updating device twin for ${deviceId}:`, error);
    throw error;
  }
};

/**
 * Close all active connections
 * @returns {Promise<boolean>} Success status
 */
const closeConnections = async () => {
  // Close all device clients
  for (const [deviceId, client] of deviceClients.entries()) {
    try {
      await client.close();
      console.log(`Closed connection for device ${deviceId}`);
    } catch (error) {
      console.error(`Error closing connection for device ${deviceId}:`, error);
    }
  }
  
  deviceClients.clear();
  
  // No need to close registry as it doesn't maintain an open connection
  return true;
};

// Export all functions
export default {
  listDevices,
  getDevice,
  invokeDeviceMethod,
  sendCloudToDeviceMessage,
  updateDeviceTwin,
  closeConnections
};