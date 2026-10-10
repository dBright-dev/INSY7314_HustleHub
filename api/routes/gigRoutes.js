const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const gigController = require('../controllers/gigController');
const { protect: authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const gigFields = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be zero or greater')
];
const validateCreate = [...gigFields];
const validateUpdate = [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be zero or greater'),
    body('status').optional().isIn(['available', 'archived']).withMessage('Invalid status')
];

router.post('/', authenticateToken, authorizeRoles('Freelancer'), validateCreate, gigController.createGig);
router.get('/', gigController.getAllGigs);
router.get('/my-gigs', authenticateToken, authorizeRoles('Freelancer'), gigController.getMyGigs);
router.get('/:id', gigController.getGigById);
router.put('/:id', authenticateToken, authorizeRoles('Freelancer'), validateUpdate, gigController.updateGig);
router.delete('/:id', authenticateToken, authorizeRoles('Freelancer'), gigController.deleteGig);

module.exports = router;
