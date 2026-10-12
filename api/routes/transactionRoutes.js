/**
 * REFERENCES (IIE Harvard style — in-text citations + reference list)
 * - In-text: protected Freelancer-only income reporting endpoint follows the
 *   INSY7314 guidance on role-restricted financial data (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Alias so /api/transactions/income works alongside /api/bookings/income
router.get('/income', protect, authorizeRoles('Freelancer'), transactionController.getFreelancerIncome);

module.exports = router;

