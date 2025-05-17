/**
 * IOT-Edge Backend Server
 * Enhanced for both IoT and Enterprise workloads
 */

import express from 'express';
import http from 'http';
// Remove Next.js dependency
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Server } from 'socket.io';

// Load environment variables from .env file
dotenv.config();

// Import utilities and services
import { isConnected } from './utils/database.js';
import queueService from './utils/queueService.js';
import socketService from './utils/socketService.js';

// Import local IoT service
let iotService = null;
let telemetryProcessor = null;

// Attempt to load local IoT service
try {
  // Import telemetry processor only
  const telemetryModule = await import('./utils/telemetryProcessor.js');
  telemetryProcessor = telemetryModule.default;
  console.log('Telemetry processor loaded successfully');
  
  // Import local IoT service
  const iotModule = await import('./utils/azure-iot.js');
  iotService = iotModule.default;
  console.log('Local IoT service loaded successfully');
} catch (error) {
  console.warn('Failed to load IoT services:', error.message);
  
  // Provide mock implementation if the real service fails to load
  iotService = {
    listDevices: async () => {
      console.log('Using mock device list');
      const mockDevices = require('./mock-data/sensors.json');
      return mockDevices;
    },
    closeConnections: async () => {
      console.log('Mock: No connections to close');
      return true;
    },
    cleanup: async () => {
      console.log('Mock: No cleanup needed');
      return true;
    }
  };
  
  // Mock telemetry processor
  telemetryProcessor = {
    initTelemetryProcessor: async () => {
      console.log('Initialized mock telemetry processor');
      return true;
    },
    on: (event, callback) => {
      console.log(`Registered mock handler for ${event} events`);
    },
    addTelemetry: async (data) => {
      console.log('Added telemetry to mock processor:', data);
      return true;
    },
    getLatestReadings: (deviceId) => {
      console.log('Getting mock readings for device:', deviceId);
      return [];
    }
  };
}

// Server configuration
const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 5000;

// Initialize the Express application
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:8080',
      process.env.FRONTEND_URL || 'http://localhost:8080'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io'
});

// Initialize socket service with Socket.IO instance
socketService.initializeSocketService(io);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
})); // Security headers
app.use(compression()); // Compress all responses
app.use(express.json({ limit: '50mb' })); // Parse JSON requests
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded requests
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    process.env.FRONTEND_URL || 'http://localhost:8080'
  ],
  credentials: true
})); // Enable CORS for specific origins

// Initialize telemetry processor if available
if (telemetryProcessor) {
  await telemetryProcessor.initTelemetryProcessor();

  // Configure telemetry processor to broadcast data via WebSockets
  telemetryProcessor.on('new-telemetry', (data) => {
    socketService.broadcastSensorData(data);
  });

  telemetryProcessor.on('alert', (alert) => {
    socketService.broadcastAlert(alert);
  });

  telemetryProcessor.on('system-event', (event) => {
    socketService.broadcastSystemEvent(event);
  });

  telemetryProcessor.on('device-status', (status) => {
    socketService.broadcastDeviceStatus(status);
  });
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Database Health Check
app.get('/api/health/database', async (req, res) => {
  const dbConnected = await isConnected();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Queue Health Check
app.get('/api/health/queues', async (req, res) => {
  try {
    const stats = await queueService.getQueueStats();
    res.status(200).json({
      status: 'ok',
      queues: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// IoT Telemetry Submission API
app.post('/api/sensor-data', async (req, res) => {
  try {
    const telemetryData = req.body;
    let success = false;
    
    if (telemetryProcessor) {
      success = await telemetryProcessor.addTelemetry(telemetryData);
    } else {
      // Simple validation if telemetryProcessor is not available
      success = telemetryData && typeof telemetryData === 'object';
    }
    
    if (success) {
      // Broadcast sensor data via WebSockets
      socketService.broadcastSensorData(telemetryData);
      
      res.status(202).json({ 
        status: 'accepted', 
        message: 'Telemetry data queued for processing' 
      });
    } else {
      res.status(400).json({ 
        status: 'error', 
        message: 'Invalid telemetry data format' 
      });
    }
  } catch (error) {
    console.error('Error in telemetry submission:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error processing telemetry data' 
    });
  }
});

// Enterprise API for managing IoT devices
app.get('/api/devices', async (req, res) => {
  try {
    // Get devices from local IoT service
    try {
      const devices = await iotService.listDevices();
      return res.status(200).json({ devices });
    } catch (iotError) {
      console.warn('Could not fetch devices from IoT service:', iotError.message);
      // Fall back to mock data if IoT service is not available
      const fs = require('fs');
      const path = require('path');
      const mockDataPath = path.join(__dirname, 'mock-data', 'sensors.json');
      
      if (fs.existsSync(mockDataPath)) {
        const mockDevices = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
        return res.status(200).json({ 
          devices: mockDevices,
          source: 'mock-data'
        });
      } else {
        return res.status(200).json({ 
          devices: [],
          source: 'empty-mock-data'
        });
      }
    }
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error fetching devices' 
    });
  }
});

// Enterprise API to get latest telemetry for all sensors
app.get('/api/sensor-data/latest', async (req, res) => {
  try {
    const { sensorId, type, limit = 10 } = req.query;
    const limitNum = parseInt(limit);
    
    // Import database utilities
    const { query } = await import('./utils/database.js');
    
    // Build SQL with optional filters
    let sql = `
      SELECT sd.id, sd.sensor_id, sd.value, sd.unit, sd.timestamp,
             s.name, s.type, s.status
      FROM sensor_data sd
      JOIN sensors s ON sd.sensor_id = s.id
    `;
    
    const params = [];
    const conditions = [];
    
    // Add sensor ID filter if provided
    if (sensorId) {
      conditions.push(`sd.sensor_id = ?`);
      params.push(sensorId);
    }
    
    // Add sensor type filter if provided
    if (type) {
      conditions.push(`s.type = ?`);
      params.push(type);
    }
    
    // Add WHERE clause if we have conditions
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add ordering and limit - using direct value instead of parameter
    sql += ` ORDER BY sd.timestamp DESC LIMIT ${limitNum}`;
    
    console.log('Executing SQL:', sql);
    console.log('With params:', params);
    
    // Query the database
    const readings = await query(sql, params);
    console.log('Database query result:', readings ? readings.length : 'null', 'readings');
    
    // Fall back to telemetryProcessor if no database results
    if (!readings || readings.length === 0) {
      console.log('No database results, falling back to telemetryProcessor');
      const fallbackReadings = telemetryProcessor ? 
        telemetryProcessor.getLatestReadings(sensorId) : [];
      return res.status(200).json({
        readings: fallbackReadings || [],
        timestamp: new Date().toISOString(),
        source: 'telemetry-processor'
      });
    }
    
    res.status(200).json({
      readings,
      timestamp: new Date().toISOString(),
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching latest sensor data:', error);
    
    // Attempt to fall back to telemetryProcessor if database query fails
    try {
      const deviceId = req.query.sensorId;
      const fallbackReadings = telemetryProcessor ? 
        telemetryProcessor.getLatestReadings(deviceId) : [];
      return res.status(200).json({
        readings: fallbackReadings || [],
        timestamp: new Date().toISOString(),
        source: 'telemetry-processor-fallback'
      });
    } catch (fallbackError) {
      // If even the fallback fails, return an error
      res.status(500).json({ 
        status: 'error', 
        message: 'Internal server error fetching latest sensor data' 
      });
    }
  }
});

// Serve a simple API info page at root
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>IOT-Edge Backend API</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; }
          ul { list-style-type: none; padding: 0; }
          li { margin-bottom: 10px; }
          code { background-color: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>IOT-Edge Backend API</h1>
        <p>This is the REST API for the IOT-Edge System. Available endpoints:</p>
        <ul>
          <li><code>GET /api/health</code> - System health check</li>
          <li><code>GET /api/health/database</code> - Database connection status</li>
          <li><code>GET /api/health/queues</code> - Message queue status</li>
          <li><code>GET /api/devices</code> - List all connected IoT devices</li>
          <li><code>GET /api/sensor-data/latest</code> - Get latest sensor readings</li>
          <li><code>POST /api/sensor-data</code> - Submit new sensor data</li>
        </ul>
      </body>
    </html>
  `);
});

// Start the server
server.listen(port, (err) => {
  if (err) throw err;
  console.log(`> Enhanced IOT-Edge Server ready on port ${port}`);
  console.log(`> Mode: ${dev ? 'development' : 'production'}`);
  console.log(`> WebSocket server is active`);
});

// Handle shutdown gracefully
const shutdown = async () => {
  console.log('Shutting down server...');
  
  try {
    // Close socket connections first to notify clients
    if (socketService && typeof socketService.cleanup === 'function') {
      await socketService.cleanup();
    } else {
      console.log('Socket service cleanup not available');
    }
    
    // Clean up telemetry processor
    if (telemetryProcessor && typeof telemetryProcessor.cleanup === 'function') {
      await telemetryProcessor.cleanup();
    } else {
      console.log('Telemetry processor cleanup not available');
    }
    
    // Close IoT service connections
    if (iotService && typeof iotService.cleanup === 'function') {
      await iotService.cleanup();
    } else {
      console.log('IoT service cleanup not available');
    }
    
    // Handle queueService cleanup if method exists
    if (queueService && typeof queueService.cleanUp === 'function') {
      await queueService.cleanUp();
    } else {
      console.log('Queue service cleanup not available');
    }
    
    console.log('All services cleaned up successfully');
    
    // Close server after cleanup is complete
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    // Force close after error
    process.exit(1);
  }
  
  // Force close after timeout as a last resort
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
