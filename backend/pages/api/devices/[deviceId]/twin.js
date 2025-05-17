/**
 * API endpoint for fetching a device twin from Azure IoT Hub
 * Device twins store metadata and configuration for IoT devices
 */

import { getDeviceTwin } from '@/utils/azure-iot';
import { withApiAuth } from '@/middleware/auth';
import { formatError as errorHandler } from '@/utils/error-handler';
import { telemetryClient } from '@/utils/telemetry';

async function handler(req, res) {
  const { deviceId } = req.query;
  
  if (!deviceId) {
    return res.status(400).json({
      error: 'INVALID_REQUEST',
      message: 'Device ID is required'
    });
  }
  
  try {
    // Track API request in Application Insights
    telemetryClient.trackRequest({
      name: 'GET /api/devices/[deviceId]/twin',
      url: `/api/devices/${deviceId}/twin`,
      duration: 0,
      resultCode: 200,
      success: true,
      properties: { deviceId }
    });
    
    const twin = await getDeviceTwin(deviceId);
    
    // Return the device twin with better formatting
    return res.status(200).json({
      deviceId: twin.deviceId,
      etag: twin.etag,
      status: twin.status,
      statusReason: twin.statusReason,
      statusUpdatedTime: twin.statusUpdatedTime,
      connectionState: twin.connectionState,
      lastActivityTime: twin.lastActivityTime,
      cloudToDeviceMessageCount: twin.cloudToDeviceMessageCount,
      authenticationType: twin.authenticationType,
      x509Thumbprint: twin.x509Thumbprint,
      version: twin.version,
      tags: twin.tags || {},
      properties: {
        desired: twin.properties?.desired || {},
        reported: twin.properties?.reported || {}
      },
      capabilities: twin.capabilities || {},
      _lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    // Track error in Application Insights
    telemetryClient.trackException({
      exception: error,
      properties: { 
        deviceId,
        operation: 'getDeviceTwin'
      }
    });
    
    return errorHandler(error, res);
  }
}

export default withApiAuth(handler);