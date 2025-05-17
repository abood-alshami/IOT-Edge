// Diagnostic API route for IOT-Edge Backend
import { withApi } from '../../middleware';

/**
 * Diagnostics handler
 * 
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const diagnosticHandler = async (req, res) => {
  try {
    // Only handle GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    }
    
    // Return system diagnostics
    return res.status(200).json({
      status: 'ok',
      message: 'IOT-Edge Backend API v5.0.1 - Diagnostic',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '5.0.1',
      environment: process.env.NODE_ENV || 'development',
      system: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        },
      },
      apiRoutes: {
        auth: {
          status: 'operational',
          endpoints: ['/api/auth/login', '/api/auth/register', '/api/auth/me'],
        },
        sensors: {
          status: 'operational',
          endpoints: ['/api/sensors', '/api/sensors/[id]'],
        },
        sensorData: {
          status: 'operational',
          endpoints: ['/api/sensor-data', '/api/sensor-data/[id]'],
        },
        monitoring: {
          status: 'operational',
          subsystems: [
            { id: 'cold-room', name: 'Cold Room Monitoring', status: 'operational' },
            { id: 'electrical', name: 'Electrical Systems', status: 'operational' },
            { id: 'entrance-door', name: 'Entrance Door Security', status: 'operational' },
            { id: 'fire-system', name: 'Fire Detection & Suppression', status: 'operational' },
            { id: 'generator', name: 'Backup Generator', status: 'operational' },
            { id: 'hvac', name: 'HVAC Systems', status: 'operational' }
          ],
        },
        ai: {
          status: 'operational',
          endpoints: ['/api/ai/analyze', '/api/ai/predict'],
        },
        config: {
          status: 'operational',
          endpoints: ['/api/config', '/api/config/[key]'],
        },
      },
    });
  } catch (error) {
    console.error('Diagnostic API error:', error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Server error in diagnostic endpoint' });
  }
};

// Export the handler with CORS middleware (no auth required)
export default withApi(diagnosticHandler, { auth: false }); 