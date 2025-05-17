/**
 * API endpoint for invoking direct methods on IoT devices
 * 
 * Allows remote invocation of commands on connected IoT devices via Azure IoT Hub
 * Version: 5.1.0 - May 12, 2025
 */

import { invokeDeviceMethod } from '../../../../../utils/azure-iot.js';
import { authenticate, authorize } from '../../../../../middleware/auth.js';
import { formatError as handleApiError } from '../../../../../utils/error-handler.js';

// Method validation rules for different method types
const methodValidationRules = {
  'reboot': {
    requiredParams: [],
    optionalParams: ['delay'],
    defaults: { delay: 0 }
  },
  'restart': {
    requiredParams: [],
    optionalParams: ['delay', 'reason'],
    defaults: { delay: 0, reason: 'API request' }
  },
  'firmware-update': {
    requiredParams: ['version', 'url'],
    optionalParams: ['forceUpdate', 'checksum', 'immediate'],
    defaults: { forceUpdate: false, immediate: false }
  },
  'set-telemetry-interval': {
    requiredParams: ['interval'],
    optionalParams: ['unit'],
    defaults: { unit: 'seconds' }
  },
  'read-configuration': {
    requiredParams: [],
    optionalParams: ['section'],
    defaults: {}
  },
  'write-configuration': {
    requiredParams: ['config'],
    optionalParams: ['section', 'reboot'],
    defaults: { reboot: false }
  },
  'diagnostics': {
    requiredParams: [],
    optionalParams: ['full', 'timeout'],
    defaults: { full: false, timeout: 30 }
  },
  'factory-reset': {
    requiredParams: ['confirm'],
    optionalParams: ['preserve'],
    defaults: { preserve: ['network'] }
  },
  'led-control': {
    requiredParams: ['state'],
    optionalParams: ['color', 'pattern', 'brightness'],
    defaults: { brightness: 100 }
  },
  'sensor-calibration': {
    requiredParams: ['sensorType'],
    optionalParams: ['offset', 'gain', 'resetToDefault'],
    defaults: { resetToDefault: false }
  }
};

// Default handler for the API endpoint
export default async function handler(req, res) {
  try {
    // Authentication middleware
    authenticate(req, res, async () => {
      // Authorization check - only admins and technicians can invoke device methods
      authorize(['admin', 'technician'])(req, res, async () => {
        try {
          // Extract parameters from path
          const { deviceId, methodName } = req.query;
          
          // Validate deviceId and methodName
          if (!deviceId) {
            return res.status(400).json({
              error: {
                code: 'MISSING_PARAMETER',
                message: 'Device ID is required'
              }
            });
          }
          
          if (!methodName) {
            return res.status(400).json({
              error: {
                code: 'MISSING_PARAMETER',
                message: 'Method name is required'
              }
            });
          }
          
          // Handle different HTTP methods
          if (req.method === 'POST') {
            // Get request body
            const payload = req.body || {};
            
            // Validate method parameters
            const validationRules = methodValidationRules[methodName];
            if (validationRules) {
              // Check for required parameters
              for (const param of validationRules.requiredParams) {
                if (payload[param] === undefined) {
                  return res.status(400).json({
                    error: {
                      code: 'MISSING_PARAMETER',
                      message: `Required parameter '${param}' is missing for method '${methodName}'`,
                      requiredParams: validationRules.requiredParams
                    }
                  });
                }
              }
              
              // Add default values for optional parameters
              for (const [param, defaultValue] of Object.entries(validationRules.defaults)) {
                if (payload[param] === undefined) {
                  payload[param] = defaultValue;
                }
              }
            }
            
            // Invoke the method on the device
            console.log(`Invoking method ${methodName} on device ${deviceId} with payload:`, payload);
            const response = await invokeDeviceMethod(deviceId, methodName, payload);
            
            // Return the method response
            return res.status(200).json({
              deviceId,
              methodName,
              status: response.status,
              result: response.payload,
              requestTime: new Date().toISOString()
            });
          } else if (req.method === 'GET') {
            // Return method metadata
            const metadata = methodValidationRules[methodName] || {
              requiredParams: [],
              optionalParams: [],
              defaults: {}
            };
            
            return res.status(200).json({
              deviceId,
              methodName,
              metadata: {
                requiredParams: metadata.requiredParams,
                optionalParams: metadata.optionalParams,
                defaults: metadata.defaults
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
          // Handle API errors
          return handleApiError(error, `invoking method ${req.query.methodName} on device ${req.query.deviceId}`, req, res);
        }
      });
    });
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error in device method API:', error);
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
}