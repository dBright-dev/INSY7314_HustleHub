/**
 * REFERENCES (IIE Harvard style — in-text citations + reference list)
 * - In-text: booking validation rules mirror the INSY7314 input-validation
 *   requirements for marketplace transactions (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

const express = require('express');
const request = require('supertest');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.json());
app.post('/bookings', body('gig').isMongoId(), (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return res.status(201).json({ success: true });
});

describe('Booking request validation', () => {
    test('rejects an invalid MongoDB object ID', async () => {
        const response = await request(app).post('/bookings').send({ gig: 'not-an-object-id' });
        expect(response.status).toBe(400);
    });

    test('rejects a request with the gig key missing', async () => {
        const response = await request(app).post('/bookings').send({});
        expect(response.status).toBe(400);
    });
});
