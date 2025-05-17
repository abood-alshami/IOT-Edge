/**
 * Device Methods API
 * Routes for invoking direct methods on IoT devices
 * Version: 5.1.0 - May 12, 2025
 */

import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { asyncHandler } from '../utils/error-handler';
import { invokeDeviceMethod, getDevice } from '../utils/azure-iot';
import { logEvent } from '../utils/telemetry';

const router = express.Router();

/**
 * @route GET /api/device-methods
 * @description Get available device methods for a device
 * @access Private (requires authentication)
 */
router.get(
  '/:deviceId',
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { deviceId } = req.params;
    
    // Get device information
    const device = await getDevice(deviceId);
    
    // Check if device has defined methods
    const deviceMethods = device.properties?.reported?.deviceMethods || [];
    
    res.json({
      deviceId,
      availableMethods: deviceMethods
    });
  })
);

/**
 * @route POST /api/device-methods/:deviceId/:methodName
 * @description Invoke a direct method on a device
 * @access Private (requires authentication)
 */
router.post(
  '/:deviceId/:methodName',
  authenticateJWT,
  authorizeRoles(['admin', 'operator']),
  asyncHandler(async (req, res) => {
    const { deviceId, methodName } = req.params;
    const payload = req.body || {};
    
    // Log the method invocation attempt
    await logEvent('device_method_invoked', {
      deviceId,
      methodName,
      userId: req.user.id,
      username: req.user.username
    });
    
    // Invoke the device method
    const result = await invokeDeviceMethod(deviceId, methodName, payload);
    
    res.json({
      deviceId,
      methodName,
      result,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * @route POST /api/device-methods/batch
 * @description Invoke a method on multiple devices
 * @access Private (requires authentication + admin role)
 */
router.post(
  '/batch',
  authenticateJWT,
  authorizeRoles('admin'),
  asyncHandler(async (req, res) => {
    const { deviceIds, methodName, payload } = req.body;
    
    if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
      res.status(400).json({ error: 'deviceIds must be a non-empty array' });
      return;
    }
    
    if (!methodName) {
      res.status(400).json({ error: 'methodName is required' });
      return;
    }
    
    // Log the batch method invocation
    await logEvent('device_method_batch_invoked', {
      deviceCount: deviceIds.length,
      methodName,
      userId: req.user.id,
      username: req.user.username
    });
    
    // Invoke method on each device
    const results = [];
    const errors = [];
    
    await Promise.all(
      deviceIds.map(async (deviceId) => {
        try {
          const result = await invokeDeviceMethod(deviceId, methodName, payload || {});
          results.push({
            deviceId,
            success: true,
            result
          });
        } catch (error) {
          errors.push({
            deviceId,
            success: false,
            error: error.message
          });
        }
      })
    );
    
    res.json({
      methodName,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors,
      timestamp: new Date().toISOString()
    });
  })
);

export default router;