/**
 * REFERENCES (IIE Harvard style)
 * - In-text: Bearer-token verification and role-based access control follow
 *   the INSY7314 authorisation guidance (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */
/**
 * Authentication & Authorization Middleware
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      // Extract token (remove "Bearer " prefix)
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Load user (exclude passwordHash)
      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user) {
        logger.warn('JWT valid but user not found', { userId: decoded.id });
        return res.status(401).json({
          success: false,
          message: 'User no longer exists',
        });
      }

      return next();
    } catch (error) {
      logger.warn('JWT verification failed', { error: error.message });

      // Specific error messages for different JWT failures
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please login again.',
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.',
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }
  }

  // No token provided
  return res.status(401).json({
    success: false,
    message: 'Not authorized. No token provided.',
  });
};

/**
 * authorizeRoles middleware - RBAC check
 * @param  {...string} roles - Allowed roles
 * @returns Express middleware
 * 
 * Usage:
 *   router.delete('/:id', protect, authorizeRoles('Admin'), deleteUser);
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('RBAC denied', {
        userRole: req.user.role,
        requiredRoles: roles,
        userId: req.user._id,
      });

      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    next();
  };
};

module.exports = { protect, authorizeRoles };