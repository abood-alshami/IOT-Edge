/**
 * Token Utility Functions
 * 
 * Provides functions for JWT token verification and management
 */

import jwt from 'jsonwebtoken';
// Fix the config import to use the CommonJS module properly
const config = require('../config');
const jwtConfig = config.jwt;

/**
 * Verify a JWT token
 * 
 * @param {string} token - The JWT token to verify
 * @returns {Promise<object>} - The decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
export const verifyToken = async (token) => {
  try {
    // For development tokens, special handling
    if (process.env.NODE_ENV === 'development' && token.startsWith('dev-jwt.')) {
      return {
        id: 999,
        username: 'dev-user',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
      };
    }
    
    // Verify the token
    const decoded = jwt.verify(token, jwtConfig.secret);
    return decoded;
  } catch (error) {
    // Add more specific error information
    if (error.name === 'TokenExpiredError') {
      error.code = 'TOKEN_EXPIRED';
      error.status = 401;
    } else if (error.name === 'JsonWebTokenError') {
      error.code = 'INVALID_TOKEN';
      error.status = 401;
    } else {
      error.code = 'AUTH_ERROR';
      error.status = 500;
    }
    throw error;
  }
};

/**
 * Generate a new JWT token
 * 
 * @param {object} user - User object with id, username, role
 * @param {number} expiresIn - Token expiration in seconds (default: from config)
 * @returns {string} - JWT token
 */
export const generateToken = (user, expiresIn = jwtConfig.expiresIn) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    jwtConfig.secret,
    { expiresIn }
  );
};

/**
 * Check if a token is blacklisted
 * 
 * @param {string} token - The JWT token to check
 * @param {object} db - Database service
 * @returns {Promise<boolean>} - True if token is blacklisted
 */
export const isTokenBlacklisted = async (token, db) => {
  try {
    const result = await db.query(
      'SELECT * FROM token_blacklist WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    
    return result && result.rows && result.rows.length > 0;
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    // Default to not blacklisted on error
    return false;
  }
};

/**
 * Blacklist a token
 * 
 * @param {string} token - The JWT token to blacklist
 * @param {object} db - Database service
 * @param {number} expireInHours - Token blacklist expiration in hours
 * @returns {Promise<boolean>} - True if successfully blacklisted
 */
export const blacklistToken = async (token, db, expireInHours = 24) => {
  try {
    await db.query(
      'INSERT INTO token_blacklist (token, expires_at) VALUES (?, DATE_ADD(NOW(), INTERVAL ? HOUR))',
      [token, expireInHours]
    );
    return true;
  } catch (error) {
    console.error('Error blacklisting token:', error);
    return false;
  }
};

/**
 * Extracts user info from a request
 * @param {Object} req - Next.js API request object 
 * @returns {Object|null} User object or null if not authenticated
 */
export function getUserFromRequest(req) {
  const userId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');
  
  if (userId && userRole) {
    return {
      id: userId,
      role: userRole,
      isAdmin: userRole === 'admin'
    };
  }
  
  return null;
}