/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect: authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateUserUpdate } = require('../middleware/validationMiddleware');

/**
 * GET /api/users
 * Get all users (Admin only)
 */
router.get('/', authenticateToken, authorizeRoles('Admin'), userController.getAllUsers);

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', authenticateToken, userController.getUserById);

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', authenticateToken, validateUserUpdate, userController.updateUser);

/**
 * DELETE /api/users/:id
 * Delete user (Admin only)
 */
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), userController.deleteUser);

module.exports = router;
