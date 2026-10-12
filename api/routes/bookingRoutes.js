/**
 * REFERENCES (IIE Harvard style — in-text citations + reference list)
 * - In-text: Client-only booking creation with rate limiting and gig-ID
 *   validation, plus Freelancer-only incoming/income views, follow the
 *   INSY7314 RBAC and transactional-booking guidance (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const transactionController = require('../controllers/transactionController');
const { protect: authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { bookingLimiter } = require('../middleware/rateLimiter');

router.post('/', authenticateToken, authorizeRoles('Client'), bookingLimiter,
    body('gig').isMongoId().withMessage('A valid gig ID is required'),
    bookingController.createBooking);
router.get('/my-bookings', authenticateToken, authorizeRoles('Client'), bookingController.getMyBookings);
router.get('/incoming', authenticateToken, authorizeRoles('Freelancer'), bookingController.getIncomingBookings);
router.get('/income', authenticateToken, authorizeRoles('Freelancer'), transactionController.getFreelancerIncome);

module.exports = router;
