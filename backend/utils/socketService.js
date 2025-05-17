/**
 * Socket Service
 * Manages real-time communication using WebSockets
 */
import { Server } from 'socket.io';

let io = null;
let isInitialized = false;

// Room definitions for different data streams
const ROOMS = {
  SENSOR_DATA: 'all:sensors',
  ALERTS: 'all:alerts',
  SYSTEM_EVENTS: 'system:events',
  DEVICE_STATUS: 'device:status'
};

/**
 * Initialize Socket.IO server
 * @param {Object} httpServer - HTTP server instance
 * @returns {boolean} - Initialization success status
 */
export const initializeSocketService = (httpServer) => {
  if (isInitialized) {
    console.warn('Socket service already initialized');
    return true;
  }

  try {
    // Create Socket.IO server with CORS configuration
    io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Connection handler
    io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle room subscriptions
      socket.on('join:room', (room) => {
        if (Object.values(ROOMS).includes(room)) {
          socket.join(room);
          console.log(`Socket ${socket.id} joined room: ${room}`);
        } else {
          console.warn(`Invalid room subscription attempt: ${room}`);
          // Join anyway since it might be a custom room
          socket.join(room);
        }
      });

      // Handle room unsubscriptions
      socket.on('leave:room', (room) => {
        socket.leave(room);
        console.log(`Socket ${socket.id} left room: ${room}`);
      });

      // Handle subscription to all sensor updates
      socket.on('subscribe:all-sensors', () => {
        socket.join(ROOMS.SENSOR_DATA);
        console.log(`Socket ${socket.id} subscribed to all sensors`);
      });
      
      // Handle subscription to all alerts
      socket.on('subscribe:all-alerts', () => {
        socket.join(ROOMS.ALERTS);
        console.log(`Socket ${socket.id} subscribed to all alerts`);
      });

      // Disconnect handler
      socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
      });
      
      // Error handler
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
      
      // Send welcome message with current timestamp to verify connection
      socket.emit('connection:established', { 
        timestamp: new Date().toISOString(),
        socketId: socket.id
      });
    });

    isInitialized = true;
    console.log('Socket service initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize socket service:', error);
    return false;
  }
};

/**
 * Broadcast sensor data to all connected clients in sensor-data room
 * @param {Object} data - Sensor data to broadcast
 */
export const broadcastSensorData = (data) => {
  if (!isInitialized || !io) {
    console.warn('Socket service not initialized. Cannot broadcast sensor data.');
    return;
  }
  
  io.to(ROOMS.SENSOR_DATA).emit('sensor-data', data);
  console.debug('Broadcasting sensor data to room:', ROOMS.SENSOR_DATA);
};

/**
 * Broadcast alert to all connected clients in alerts room
 * @param {Object} alert - Alert data to broadcast
 */
export const broadcastAlert = (alert) => {
  if (!isInitialized || !io) {
    console.warn('Socket service not initialized. Cannot broadcast alert.');
    return;
  }
  
  io.to(ROOMS.ALERTS).emit('alert', alert);
  console.debug('Broadcasting alert to room:', ROOMS.ALERTS);
};

/**
 * Broadcast system event to all connected clients in system-events room
 * @param {Object} event - System event to broadcast
 */
export const broadcastSystemEvent = (event) => {
  if (!isInitialized || !io) {
    console.warn('Socket service not initialized. Cannot broadcast system event.');
    return;
  }
  
  io.to(ROOMS.SYSTEM_EVENTS).emit('system-event', event);
  console.debug('Broadcasting system event to room:', ROOMS.SYSTEM_EVENTS);
};

/**
 * Broadcast device status update to all connected clients in device-status room
 * @param {Object} status - Device status to broadcast
 */
export const broadcastDeviceStatus = (status) => {
  if (!isInitialized || !io) {
    console.warn('Socket service not initialized. Cannot broadcast device status.');
    return;
  }
  
  io.to(ROOMS.DEVICE_STATUS).emit('device-status', status);
  console.debug('Broadcasting device status to room:', ROOMS.DEVICE_STATUS);
};

/**
 * Send a message to a specific client
 * @param {string} socketId - Socket ID to send to
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
export const sendToClient = (socketId, event, data) => {
  if (!isInitialized || !io) {
    console.warn('Socket service not initialized. Cannot send message to client.');
    return;
  }
  
  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    socket.emit(event, data);
  } else {
    console.warn(`Socket ${socketId} not found`);
  }
};

/**
 * Broadcast a message to all connected clients
 * @param {string} event - Event name 
 * @param {Object} data - Data to broadcast
 */
export const broadcastToAll = (event, data) => {
  if (!isInitialized || !io) {
    console.warn('Socket service not initialized. Cannot broadcast to all clients.');
    return;
  }
  
  io.emit(event, data);
  console.debug(`Broadcasting '${event}' to all connected clients`);
};

/**
 * Get active connection count
 * @returns {number} - Number of active connections
 */
export const getConnectionCount = () => {
  if (!isInitialized || !io) {
    return 0;
  }
  
  return io.sockets.sockets.size;
};

/**
 * Get a list of rooms with their member counts
 * @returns {Object} - Rooms and their member counts
 */
export const getRoomStats = async () => {
  if (!isInitialized || !io) {
    return {};
  }
  
  const stats = {};
  
  for (const room of Object.values(ROOMS)) {
    const sockets = await io.in(room).fetchSockets();
    stats[room] = sockets.length;
  }
  
  return stats;
};

/**
 * Clean up socket connections
 * @returns {Promise<boolean>} Success status
 */
export const cleanup = async () => {
  if (!isInitialized || !io) {
    console.log('Socket service not initialized, no cleanup needed');
    return true;
  }
  
  try {
    console.log('Cleaning up socket connections...');
    
    // Notify all clients of server shutdown
    broadcastToAll('server:shutdown', {
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    });
    
    // Get active connection count before cleanup
    const connectionCount = getConnectionCount();
    console.log(`Closing ${connectionCount} active socket connections`);
    
    // Close all socket connections
    const sockets = await io.fetchSockets();
    for (const socket of sockets) {
      socket.disconnect(true);
    }
    
    // Reset state
    isInitialized = false;
    io = null;
    
    console.log('Socket connections cleaned up successfully');
    return true;
  } catch (error) {
    console.error('Error cleaning up socket connections:', error);
    return false;
  }
};

export const SOCKET_ROOMS = ROOMS;

export default {
  initializeSocketService,
  broadcastSensorData,
  broadcastAlert,
  broadcastSystemEvent,
  broadcastDeviceStatus,
  sendToClient,
  broadcastToAll,
  getConnectionCount,
  getRoomStats,
  cleanup,
  SOCKET_ROOMS
};