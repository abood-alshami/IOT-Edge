/**
 * Redis Health Monitor
 * Monitors Redis connection status and provides health information
 */
import Redis from 'ioredis';
import { EventEmitter } from 'events';

class RedisHealth extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.isConnected = false;
    this.lastError = null;
    this.lastCheck = null;
  }

  async connect() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || '',
        tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 200, 2000);
          return delay;
        }
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.lastError = null;
        this.lastCheck = new Date().toISOString();
        this.emit('connected');
        console.log('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        this.lastError = error.message;
        this.lastCheck = new Date().toISOString();
        this.emit('error', error);
        console.error('Redis connection error:', error);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.lastCheck = new Date().toISOString();
        this.emit('disconnected');
        console.log('Redis connection closed');
      });

      // Start health check interval
      this.startHealthCheck();

      return true;
    } catch (error) {
      console.error('Failed to initialize Redis connection:', error);
      this.lastError = error.message;
      this.lastCheck = new Date().toISOString();
      return false;
    }
  }

  async startHealthCheck() {
    setInterval(async () => {
      try {
        await this.client.ping();
        if (!this.isConnected) {
          this.isConnected = true;
          this.lastError = null;
          this.emit('connected');
        }
      } catch (error) {
        if (this.isConnected) {
          this.isConnected = false;
          this.lastError = error.message;
          this.emit('error', error);
        }
      }
      this.lastCheck = new Date().toISOString();
    }, 5000); // Check every 5 seconds
  }

  async getStatus() {
    return {
      connected: this.isConnected,
      lastError: this.lastError,
      lastCheck: this.lastCheck
    };
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      this.lastCheck = new Date().toISOString();
      this.emit('disconnected');
    }
  }
}

// Export singleton instance
export default new RedisHealth();