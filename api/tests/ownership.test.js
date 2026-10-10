jest.mock('../models/Gig', () => ({ findById: jest.fn() }));

const express = require('express');
const request = require('supertest');
const Gig = require('../models/Gig');
const gigController = require('../controllers/gigController');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    // Simulate an authenticated Freelancer while keeping these tests focused on ownership.
    req.user = { id: '64b000000000000000000001', role: 'Freelancer' };
    next();
});
app.put('/gigs/:id', gigController.updateGig);
app.delete('/gigs/:id', gigController.deleteGig);

describe('Gig ownership enforcement', () => {
    beforeEach(() => {
        Gig.findById.mockResolvedValue({
            _id: '64b000000000000000000010',
            owner: { toString: () => '64b000000000000000000002' },
            save: jest.fn(),
            deleteOne: jest.fn()
        });
    });

    afterEach(() => jest.clearAllMocks());

    test('returns 403 when a Freelancer updates another Freelancer gig', async () => {
        const response = await request(app).put('/gigs/64b000000000000000000010').send({ title: 'Hijacked title' });
        expect(response.status).toBe(403);
    });

    test('returns 403 when a Freelancer deletes another Freelancer gig', async () => {
        const response = await request(app).delete('/gigs/64b000000000000000000010');
        expect(response.status).toBe(403);
    });
});
