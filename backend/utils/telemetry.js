/**
 * Telemetry Utility
 * Handles application monitoring, logging, and analytics
 * Version: 5.1.0 - May 12, 2025
 */

import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Application metadata
const APP_NAME = 'iot-edge';
const APP_VERSION = process.env.APP_VERSION || '5.1.0';
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const INSTANCE_ID = process.env.INSTANCE_ID || uuidv4();

// Telemetry configuration
const TELEMETRY_ENABLED = process.env.TELEMETRY_ENABLED !== 'false';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Log levels with corresponding numeric values
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4
};

// Current numeric log level
const CURRENT_LOG_LEVEL = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;

/**
 * Get system information for telemetry context
 * @returns {Object} - System information
 */
const getSystemInfo = () => {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    uptime: os.uptime(),
    memory: {
      total: os.totalmem(),
      free: os.freemem()
    },
    cpus: os.cpus().length
  };
};

/**
 * Base telemetry context
 */
const getTelemetryContext = () => {
  return {
    app: APP_NAME,
    version: APP_VERSION,
    environment: ENVIRONMENT,
    instanceId: INSTANCE_ID,
    timestamp: new Date().toISOString()
  };
};

/**
 * Log an event with telemetry
 * @param {string} eventName - Name of the event
 * @param {Object} eventData - Event data
 * @param {string} level - Log level (error, warn, info, debug, trace)
 */
export const logEvent = (eventName, eventData = {}, level = 'info') => {
  // Skip if telemetry is disabled or log level is too verbose
  if (!TELEMETRY_ENABLED || LOG_LEVELS[level] > CURRENT_LOG_LEVEL) {
    return;
  }

  const context = getTelemetryContext();
  const eventInfo = {
    event: eventName,
    level,
    ...context,
    data: eventData
  };

  // Log to console based on level
  switch (level) {
    case 'error':
      console.error(JSON.stringify(eventInfo));
      break;
    case 'warn':
      console.warn(JSON.stringify(eventInfo));
      break;
    case 'debug':
      console.debug(JSON.stringify(eventInfo));
      break;
    case 'trace':
      console.trace(JSON.stringify(eventInfo));
      break;
    case 'info':
    default:
      console.log(JSON.stringify(eventInfo));
  }

  // In a production environment, you might send this to an external service
  // sendToTelemetryService(eventInfo);
};

/**
 * Capture an exception for telemetry
 * @param {Error} error - The error object
 * @param {Object} context - Additional context
 */
export const captureException = (error, context = {}) => {
  logEvent('exception', {
    message: error.message,
    name: error.name,
    stack: error.stack,
    ...context
  }, 'error');
};

/**
 * Log application startup information
 */
export const logStartup = () => {
  const systemInfo = getSystemInfo();
  
  logEvent('app.startup', {
    system: systemInfo,
    config: {
      logLevel: LOG_LEVEL,
      telemetryEnabled: TELEMETRY_ENABLED
    }
  });
};

/**
 * Log application shutdown information
 */
export const logShutdown = () => {
  logEvent('app.shutdown', {
    uptime: process.uptime()
  });
};

/**
 * Log API request information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in milliseconds
 */
export const logApiRequest = (req, res, duration) => {
  // Skip logging if too verbose
  if (LOG_LEVELS.info > CURRENT_LOG_LEVEL) {
    return;
  }
  
  const { method, originalUrl, ip, headers } = req;
  
  logEvent('api.request', {
    method,
    url: originalUrl,
    statusCode: res.statusCode,
    duration,
    ip,
    userAgent: headers['user-agent'],
    contentLength: res.getHeader('content-length')
  });
};

/**
 * Log database query performance
 * @param {string} query - SQL query (sanitized)
 * @param {number} duration - Query duration in milliseconds
 */
export const logDbQuery = (query, duration) => {
  // Skip logging if too verbose
  if (LOG_LEVELS.debug > CURRENT_LOG_LEVEL) {
    return;
  }
  
  // Sanitize query to remove sensitive data
  const sanitizedQuery = query.replace(/(['"])[^'"]*\1/g, "'***'");
  
  logEvent('db.query', {
    query: sanitizedQuery,
    duration
  }, 'debug');
};

/**
 * Express middleware for request logging
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // When response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logApiRequest(req, res, duration);
  });
  
  next();
};

// TelemetryClient stub for compatibility
export const telemetryClient = {
  trackRequest: (data) => logEvent('api.request', data),
  trackException: ({ exception, properties }) => captureException(exception, properties)
};

export default {
  logEvent,
  captureException,
  logStartup,
  logShutdown,
  logApiRequest,
  logDbQuery,
  requestLogger
};