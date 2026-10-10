const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Alias so /api/transactions/income works alongside /api/bookings/income
router.get('/income', protect, authorizeRoles('Freelancer'), transactionController.getFreelancerIncome);

module.exports = router;

