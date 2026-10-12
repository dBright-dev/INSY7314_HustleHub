/**
 * REFERENCES (IIE Harvard style)
 * - In-text: centralised error handling that hides stack traces in production
 *   follows the INSY7314 secure-error-handling guidance (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */
/**
 * Centralized Error Handler
 */

const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log full error internally
  logger.error('Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Determine status code
  let statusCode = err.statusCode || 500;
  let message = 'An unexpected error occurred';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID';
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (statusCode < 500) {
    // Client errors (4xx) can show the message
    message = err.message || message;
  }

  // Build response - NEVER include stack trace in production
  const response = {
    success: false,
    message,
  };

  // Add stack trace ONLY in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  // Add validation errors if present
  if (err.validationErrors) {
    response.errors = err.validationErrors;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

module.exports = { errorHandler, notFound };