/**
 * REFERENCES (IIE Harvard style — in-text citations + reference list)
 * - In-text: central error handling that hides stack traces from clients
 *   follows the INSY7314 secure API error-handling guidance (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

/**
 * Error Handler Middleware Tests
 */

jest.mock('../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const { errorHandler } = require('../middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { originalUrl: '/api/test', method: 'GET', ip: '127.0.0.1' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    process.env.NODE_ENV = 'production';
  });

  it('should return 500 with generic message for server errors', () => {
    const err = new Error('Database connection failed');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    );
  });

  it('should NOT expose stack trace in production', () => {
    const err = new Error('Internal error');
    errorHandler(err, req, res, next);

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.stack).toBeUndefined();
  });

  it('should expose stack trace in development', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('Dev error');
    errorHandler(err, req, res, next);

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.stack).toBeDefined();
  });

  it('should handle ValidationError with 400', () => {
    const err = new Error('Validation failed');
    err.name = 'ValidationError';
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle duplicate key errors (code 11000)', () => {
    const err = new Error('Duplicate');
    err.code = 11000;
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
