/**
 * Error Handler Utility
 * Centralized error handling for API requests
 * Version: 5.1.0 - May 12, 2025
 */

import { captureException } from './telemetry';

// Default error responses
const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred';
const DEFAULT_STATUS_CODE = 500;

/**
 * Custom error class with additional properties
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, data = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Format error response for API
 * @param {Error} error - The error object
 * @returns {Object} - Formatted error response
 */
export const formatErrorResponse = (error) => {
  const statusCode = error.statusCode || DEFAULT_STATUS_CODE;
  const message = error.message || DEFAULT_ERROR_MESSAGE;
  
  const response = {
    error: {
      message,
      status: statusCode,
      code: error.name || 'InternalServerError'
    }
  };
  
  // Include additional data if available
  if (error.data) {
    response.error.details = error.data;
  }
  
  // Include stack trace in development mode only
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }
  
  return response;
};

/**
 * Handle API errors and send appropriate response
 * @param {Error} error - The error object
 * @param {Object} res - Express response object
 */
export const handleError = (error, res) => {
  // Create a structured error if a simple message or object was passed
  let structuredError = error;
  if (typeof error === 'string') {
    structuredError = new ApiError(error);
  } else if (!(error instanceof Error)) {
    structuredError = new ApiError(
      error.message || DEFAULT_ERROR_MESSAGE,
      error.statusCode || DEFAULT_STATUS_CODE,
      error.data
    );
  }
  
  // Set default status code if not present
  const statusCode = structuredError.statusCode || DEFAULT_STATUS_CODE;
  
  // Log the error unless it's a 4xx client error
  if (statusCode >= 500) {
    console.error('[API Error]', structuredError);
    
    // Capture exception with telemetry if it's a server error
    captureException(structuredError, {
      statusCode,
      name: structuredError.name
    });
  }
  
  // Send formatted response
  res.status(statusCode).json(formatErrorResponse(structuredError));
};

/**
 * Async request handler that catches errors
 * @param {Function} fn - Async route handler
 * @returns {Function} - Express middleware
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(error => {
      handleError(error, res);
    });
  };
};

/**
 * Create a validation error
 * @param {string} message - Error message
 * @param {Object} validationErrors - Validation error details
 * @returns {ApiError} - Validation error
 */
export const createValidationError = (message, validationErrors) => {
  return new ApiError(
    message || 'Validation failed',
    400,
    { validationErrors }
  );
};

/**
 * Create a not found error
 * @param {string} resource - Resource type
 * @param {string|number} identifier - Resource identifier
 * @returns {ApiError} - Not found error
 */
export const createNotFoundError = (resource, identifier) => {
  const message = `${resource} not found${identifier ? `: ${identifier}` : ''}`;
  return new ApiError(message, 404);
};

/**
 * Express error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorMiddleware = (err, req, res, next) => {
  handleError(err, res);
};

export default {
  ApiError,
  formatErrorResponse,
  handleError,
  asyncHandler,
  createValidationError,
  createNotFoundError,
  errorMiddleware
};