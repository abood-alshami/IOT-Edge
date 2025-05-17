import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.isConnected = false;
  }

  connect() {
    // Only run on client side
    if (typeof window === 'undefined') {
      return Promise.resolve(null);
    }

    if (this.socket) {
      return Promise.resolve(this.socket);
    }

    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('token');
      
      this.socket = io(SOCKET_URL, {
        path: '/api/socket',
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.isConnected = true;
        resolve(this.socket);
      });

      this.socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        reject(err);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this.isConnected = false;
      });

      // Listen for predefined events
      this.socket.on('sensor:update', (data) => {
        this.emitLocalEvent('sensor:update', data);
      });

      this.socket.on('alert:new', (data) => {
        this.emitLocalEvent('alert:new', data);
      });

      this.socket.on('device:status', (data) => {
        this.emitLocalEvent('device:status', data);
      });
      
      // AI predictions
      this.socket.on('prediction:new', (data) => {
        this.emitLocalEvent('prediction:new', data);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emitLocalEvent(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Emit an event to the server
  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit(event, data);
  }
}

// Create a singleton instance that's initialized on first import
let socketService;

// Ensure we only create the service on the client side
if (typeof window !== 'undefined') {
  if (!socketService) {
    socketService = new SocketService();
  }
} else {
  // Mock service for server-side rendering
  socketService = {
    connect: () => Promise.resolve(null),
    disconnect: () => {},
    subscribe: () => () => {},
    emit: () => {},
    isConnected: false
  };
}

export default socketService; 