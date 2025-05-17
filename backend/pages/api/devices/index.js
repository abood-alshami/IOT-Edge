/**
 * API endpoint for listing devices from Azure IoT Hub with filtering options
 * Provides a comprehensive view of all registered IoT devices
 */

import { listDevices } from '../../../utils/azure-iot';
import { withApiAuth } from '../../../middleware/auth';
import { formatError as errorHandler } from '../../../utils/error-handler';
import { telemetryClient } from '../../../utils/telemetry';

async function handler(req, res) {
  // Only allow GET for device listing
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      message: `Method ${req.method} not allowed, use GET`
    });
  }
  
  try {
    // Extract query parameters for filtering
    const {
      query = 'SELECT * FROM devices',
      pageSize = 100,
      maxResults = 1000,
      status,
      location,
      type
    } = req.query;
    
    // Build query with filters if provided
    let deviceQuery = query;
    if (status || location || type) {
      deviceQuery = 'SELECT * FROM devices WHERE ';
      
      const conditions = [];
      if (status) conditions.push(`status = '${status}'`);
      if (location && location !== 'all') {
        conditions.push(`tags.location = '${location}'`);
      }
      if (type && type !== 'all') {
        conditions.push(`tags.type = '${type}'`);
      }
      
      deviceQuery += conditions.join(' AND ');
    }
    
    // Track this API call in Application Insights
    telemetryClient.trackRequest({
      name: 'GET /api/devices',
      url: '/api/devices',
      duration: 0,
      resultCode: 200,
      success: true,
      properties: { 
        query: deviceQuery,
        pageSize,
        maxResults
      }
    });
    
    const options = {
      query: deviceQuery,
      pageSize: parseInt(pageSize, 10),
      maxResults: parseInt(maxResults, 10)
    };
    
    const devices = await listDevices(options);
    
    // Format the devices for the API response
    const formattedDevices = devices.map(device => ({
      id: device.deviceId,
      status: device.status,
      connectionState: device.connectionState,
      lastActivityTime: device.lastActivityTime,
      type: device.tags?.type || 'unknown',
      location: device.tags?.location || 'unknown',
      firmware: device.properties?.reported?.firmware?.version || 'unknown',
      telemetry: {
        temperature: device.properties?.reported?.temperature,
        humidity: device.properties?.reported?.humidity,
        power: device.properties?.reported?.power
      },
      metadata: {
        modelId: device.modelId,
        etag: device.etag,
        version: device.version,
        authenticationType: device.authenticationType
      }
    }));
    
    // Return the devices with metadata
    return res.status(200).json({
      devices: formattedDevices,
      count: formattedDevices.length,
      _query: {
        original: query,
        executed: deviceQuery,
        pageSize: parseInt(pageSize, 10),
        maxResults: parseInt(maxResults, 10)
      },
      _timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Track error in Application Insights
    telemetryClient.trackException({
      exception: error,
      properties: { 
        operation: 'listDevices'
      }
    });
    
    return errorHandler(error, res);
  }
}

export default withApiAuth(handler);