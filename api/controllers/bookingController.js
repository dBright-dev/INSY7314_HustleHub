/**
 * REFERENCES (IIE Harvard style)
 * - In-text: atomic booking + transaction writes (Mongoose session) follow
 *   the INSY7314 transaction-integrity guidance (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Gig = require('../models/Gig');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

const currentUserId = req => req.user && (req.user.id || req.user.userId || req.user._id);

exports.createBooking = async (req, res, next) => {
    try {
        const validation = validationResult(req);
        if (!validation.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.array() });
        const { gig: gigId } = req.body;
        if (!gigId || !mongoose.Types.ObjectId.isValid(gigId)) return res.status(400).json({ success: false, message: 'A valid gig ID is required' });
        const gig = await Gig.findOne({ _id: gigId, status: 'available' });
        if (!gig) return res.status(404).json({ success: false, message: 'Available gig not found' });
        const clientId = currentUserId(req);
        if (gig.owner.toString() === String(clientId)) return res.status(400).json({ success: false, message: 'You cannot book your own gig' });

        // Persist the booking and payment record together so a partial payment cannot be recorded.
        const session = await mongoose.startSession();
        let booking;
        try {
            await session.withTransaction(async () => {
                [booking] = await Booking.create([{
                    gig: gig._id, client: clientId, freelancer: gig.owner
                }], { session });
                await Transaction.create([{
                    booking: booking._id, amount: gig.price,
                    client: clientId, freelancer: gig.owner
                }], { session });
            });
        } finally { await session.endSession(); }

        return res.status(201).json({ success: true, data: booking });
    } catch (error) { return next(error); }
};

exports.getMyBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ client: currentUserId(req) })
            .populate('gig').populate('freelancer', 'name').sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: bookings });
    } catch (error) { return next(error); }
};

exports.getIncomingBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ freelancer: currentUserId(req) })
            .populate('gig').populate('client', 'name').sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: bookings });
    } catch (error) { return next(error); }
};
