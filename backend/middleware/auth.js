/**
 * Authentication Middleware
 * Handles user authentication and authorization for API endpoints
 * Version: 5.1.0 - May 12, 2025
 */

import jwt from 'jsonwebtoken';
import { formatErrorResponse } from '../utils/error-handler.js';
import { logEvent } from '../utils/telemetry';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'iot-edge-development-secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';
const TOKEN_PREFIX = 'Bearer ';

/**
 * Extract JWT token from Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} - JWT token or null if not found
 */
const extractToken = (req) => {
  if (!req.headers || !req.headers.authorization) {
    return null;
  }
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader.startsWith(TOKEN_PREFIX)) {
    return null;
  }
  
  return authHeader.substring(TOKEN_PREFIX.length);
};

/**
 * Authenticate request using JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateJWT = (req, res, next) => {
  const token = extractToken(req);
  
  if (!token) {
    const error = new Error('Authentication token is missing');
    error.status = 401;
    error.code = 'UNAUTHORIZED';
    return res.status(401).json(formatError(error));
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    // Log successful authentication if telemetry is enabled
    logEvent('auth.success', {
      userId: decoded.id,
      userRole: decoded.role
    });
    
    next();
  } catch (error) {
    // Log failed authentication if telemetry is enabled
    logEvent('auth.failure', {
      error: error.name,
      message: error.message
    });
    
    const authError = new Error('Invalid or expired authentication token');
    authError.status = 401;
    authError.code = 'JWT_ERROR';
    return res.status(401).json(formatError(authError));
  }
};

/**
 * Authorize request based on user role
 * @param {string[]} allowedRoles - List of roles allowed to access the endpoint
 * @returns {Function} - Express middleware
 */
export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('Authentication required');
      error.status = 401;
      error.code = 'UNAUTHORIZED';
      return res.status(401).json(formatError(error));
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      // Log authorization failure if telemetry is enabled
      logEvent('auth.authorization_failure', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
      
      const error = new Error('Insufficient permissions to access this resource');
      error.status = 403;
      error.code = 'FORBIDDEN';
      return res.status(403).json(formatError(error));
    }
    
    next();
  };
};

/**
 * Generate JWT token for authenticated user
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

/**
 * Optional authentication middleware
 * Populates req.user if token is valid, but continues even if not present
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const optionalAuthentication = (req, res, next) => {
  const token = extractToken(req);
  
  if (!token) {
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    // Invalid token, but we continue anyway
    console.warn('Invalid token in optional authentication:', error.message);
  }
  
  next();
};

/**
 * API key authentication middleware for device access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    const error = new Error('API key is missing');
    error.status = 401;
    error.code = 'UNAUTHORIZED';
    return res.status(401).json(formatError(error));
  }
  
  // API key validation logic - in a real app, this would check against stored keys
  const API_KEYS = process.env.API_KEYS ? process.env.API_KEYS.split(',') : ['dev-api-key-1234'];
  
  if (!API_KEYS.includes(apiKey)) {
    // Log failed API key authentication if telemetry is enabled
    logEvent('auth.api_key_failure', {
      apiKey: apiKey.substr(0, 4) + '******' // Log only prefix for security
    });
    
    const error = new Error('Invalid API key');
    error.status = 401;
    error.code = 'UNAUTHORIZED';
    return res.status(401).json(formatError(error));
  }
  
  // Log successful API key authentication if telemetry is enabled
  logEvent('auth.api_key_success', {
    apiKey: apiKey.substr(0, 4) + '******' // Log only prefix for security
  });
  
  next();
};

// API route wrapper to enforce JWT authentication
export const withApiAuth = (handler) => async (req, res) => {
  authenticateJWT(req, res, async () => {
    await handler(req, res);
  });
};

// Alias for backward compatibility with handler imports
export const authenticate = authenticateJWT;
export const authorize = authorizeRoles;

export default {
  authenticateJWT,
  authorizeRoles,
  generateToken,
  optionalAuthentication,
  authenticateApiKey,
  authenticate,
  authorize,
  withApiAuth
};