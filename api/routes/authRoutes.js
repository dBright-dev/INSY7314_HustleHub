/**
 * REFERENCES (IIE Harvard style — in-text citations + reference list)
 * - In-text: rate-limited, validated public auth endpoints and JWT-protected
 *   routes follow the INSY7314 authentication design guidance (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();

const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');

/**
 * POST /api/auth/register
 * Public route with rate limiting and validation
 */
router.post('/register', authLimiter, validateRegister, register);

/**
 * POST /api/auth/login
 * Public route with rate limiting and validation
 */
router.post('/login', authLimiter, validateLogin, login);

/**
 * GET /api/auth/me
 * Protected route - requires valid JWT
 */
router.get('/me', protect, getMe);

module.exports = router;