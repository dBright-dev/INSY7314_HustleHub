/*
 * Input Validation & Sanitization Middleware
 */

const { body, validationResult } = require('express-validator');

/**
 * Helper: Format validation errors for consistent API responses
 */
const formatErrors = (errors) => {
  return errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));
};

/**
 * Registration validation rules
 */
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('Email is too long'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/\d/).withMessage('Password must contain a number')
    .matches(/[@$!%*?&#^()_\-+=[\]{};:'",.<>/?\\|`~]/)
    .withMessage('Password must contain a special character'),

  body('role')
    .optional()
    .isIn(['Client', 'Freelancer', 'Admin'])
    .withMessage('Role must be Client, Freelancer, or Admin'),

  // Final handler to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatErrors(errors),
      });
    }
    next();
  },
];

/**
 * Login validation rules
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatErrors(errors),
      });
    }
    next();
  },
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUserUpdate: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters')
      .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters'),
    body('role')
      .optional()
      .isIn(['Client', 'Freelancer', 'Admin'])
      .withMessage('Role must be Client, Freelancer, or Admin'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: formatErrors(errors) });
      }
      next();
    },
  ],
};