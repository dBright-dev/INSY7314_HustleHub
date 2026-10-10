const mongoose = require('mongoose');
const Gig = require('../models/Gig');

describe('Gig schema validation', () => {
    const validGig = {
        title: 'Design a logo',
        description: 'A custom brand logo',
        category: 'Design',
        price: 250,
        owner: new mongoose.Types.ObjectId()
    };

    test('rejects an empty title', () => {
        const gig = new Gig({ ...validGig, title: '   ' });
        expect(gig.validateSync().errors.title).toBeDefined();
    });

    test('rejects negative and nonnumeric prices', () => {
        const negative = new Gig({ ...validGig, price: -1 });
        const nonnumeric = new Gig({ ...validGig, price: 'not-a-price' });
        expect(negative.validateSync().errors.price).toBeDefined();
        expect(nonnumeric.validateSync().errors.price).toBeDefined();
    });

    test('rejects a missing category', () => {
        const gig = new Gig({ ...validGig, category: undefined });
        expect(gig.validateSync().errors.category).toBeDefined();
    });
});
