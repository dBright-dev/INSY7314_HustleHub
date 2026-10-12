/**
 * REFERENCES (IIE Harvard style)
 * - In-text: JWT issue/verify, bcrypt hashing and generic login failure
 *   messages follow the INSY7314 authentication guidance (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */
/**
 * Authentication Controller
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } 
  );
};


const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Create user 
    const user = await User.create({
      name,
      email,
      passwordHash: password, // Model hashes this
      role: role || 'Client',
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    logger.info('User registered', { userId: user._id, email: user.email, role: user.role });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error); // Pass to centralized error handler
  }
};


const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include passwordHash field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    // Generic message for security (don't reveal if email exists)
    const invalidMsg = 'Invalid email or password';

    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      return res.status(401).json({
        success: false,
        message: invalidMsg,
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      logger.warn('Login attempt with wrong password', { email });
      return res.status(401).json({
        success: false,
        message: invalidMsg,
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    logger.info('User logged in', { userId: user._id, email: user.email });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};


const getMe = async (req, res, next) => {
  try {
    // req.user is already set by protect middleware
    const user = await User.findById(req.user._id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  generateToken, // Export for testing
};