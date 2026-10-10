const { body, validationResult } = require('express-validator');

const validateBooking = [
  body('gig').isMongoId().withMessage('A valid gig ID is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    next();
  },
];

module.exports = { validateBooking };

