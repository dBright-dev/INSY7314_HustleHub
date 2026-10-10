jest.mock('../models/Gig', () => ({ findOne: jest.fn() }));
jest.mock('../models/Booking', () => ({ create: jest.fn() }));
jest.mock('../models/Transaction', () => ({ create: jest.fn() }));

const mongoose = require('mongoose');
const Gig = require('../models/Gig');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const { createBooking } = require('../controllers/bookingController');

describe('createBooking payment record', () => {
    afterEach(() => jest.restoreAllMocks());

    test('writes a transaction linked to the booking for the exact gig price', async () => {
        const gigId = new mongoose.Types.ObjectId();
        const clientId = new mongoose.Types.ObjectId();
        const freelancerId = new mongoose.Types.ObjectId();
        const bookingId = new mongoose.Types.ObjectId();
        const session = { withTransaction: jest.fn(async callback => callback()), endSession: jest.fn() };
        jest.spyOn(mongoose, 'startSession').mockResolvedValue(session);
        Gig.findOne.mockResolvedValue({ _id: gigId, owner: freelancerId, price: 425.5 });
        Booking.create.mockImplementation(async ([data]) => [{ ...data, _id: bookingId }]);
        Transaction.create.mockResolvedValue([]);

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        const next = jest.fn();
        await createBooking({ body: { gig: String(gigId) }, user: { id: String(clientId) } }, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(Booking.create).toHaveBeenCalledWith([
            expect.objectContaining({ gig: gigId, client: String(clientId), freelancer: freelancerId })
        ], { session });
        expect(Transaction.create).toHaveBeenCalledWith([
            expect.objectContaining({ booking: bookingId, amount: 425.5, client: String(clientId), freelancer: freelancerId })
        ], { session });
        expect(session.endSession).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });
});
