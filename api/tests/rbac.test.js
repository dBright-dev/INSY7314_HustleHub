/**
 * REFERENCES (IIE Harvard style — in-text citations + reference list)
 * - In-text: role-separation assertions (Client / Freelancer / Admin) mirror
 *   the INSY7314 role-based access-control requirements (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

/**
 * RBAC Middleware Unit Tests
 */

// Mock logger before requiring middleware
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Mock User model to prevent DB connection attempts
jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

const { authorizeRoles } = require('../middleware/authMiddleware');

describe('RBAC authorizeRoles middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { _id: 'user123', role: 'Client' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('should call next() when user role matches allowed roles', () => {
    const mw = authorizeRoles('Client', 'Freelancer');
    mw(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 403 when user role does NOT match', () => {
    const mw = authorizeRoles('Freelancer', 'Admin');
    mw(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('is not authorized'),
      })
    );
  });

  it('should allow Admin when Admin is in allowed roles', () => {
    req.user.role = 'Admin';
    const mw = authorizeRoles('Admin');
    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should block access when no user is attached to request', () => {
    req.user = null;
    const mw = authorizeRoles('Client');
    mw(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should work with a single role', () => {
    req.user.role = 'Freelancer';
    const mw = authorizeRoles('Freelancer');
    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should work with multiple roles', () => {
    req.user.role = 'Admin';
    const mw = authorizeRoles('Client', 'Freelancer', 'Admin');
    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
