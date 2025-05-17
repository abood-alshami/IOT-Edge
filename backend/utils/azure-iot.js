/**
 * Azure IoT Hub Compatibility Wrapper
 * Provides a drop-in replacement for Azure IoT Hub using local implementation
 * Version: 1.0.0 - May 12, 2025
 */

import localIot from './local-iot.js';

// Initialize the local IoT service
try {
  await localIot.initialize();
  console.log('Local IoT service initialized as a replacement for Azure IoT Hub');
} catch (error) {
  console.error('Failed to initialize local IoT service:', error);
}

// Re-export all functions from local-iot.js with the same interface
export const listDevices = localIot.listDevices;
export const getDevice = localIot.getDevice;
export const getDeviceTwin = localIot.getDeviceTwin;
export const updateDeviceTwin = localIot.updateDeviceTwin;
export const invokeDeviceMethod = localIot.invokeDeviceMethod;
export const sendC2DMessage = localIot.sendC2DMessage;
export const getDeviceTelemetry = localIot.getDeviceTelemetry;
export const startTelemetryListener = localIot.startTelemetryListener;
export const stopTelemetryListener = localIot.stopTelemetryListener;
export const deviceExists = localIot.deviceExists;
export const registerDevice = localIot.registerDevice;
export const deleteDevice = localIot.deleteDevice;
export const cleanup = localIot.cleanup;

// Export default object with all functions
export default {
  listDevices,
  getDevice,
  getDeviceTwin,
  updateDeviceTwin,
  invokeDeviceMethod,
  sendC2DMessage,
  getDeviceTelemetry,
  startTelemetryListener,
  stopTelemetryListener,
  deviceExists,
  registerDevice,
  deleteDevice,
  cleanup
};