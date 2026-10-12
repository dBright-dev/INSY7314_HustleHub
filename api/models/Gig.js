/**
 * REFERENCES (IIE Harvard style)
 * - In-text: Mongoose schemas with owner references and status enums follow
 *   the INSY7314 data-modelling guidance (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */


const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['available', 'archived'], default: 'available' }
}, { timestamps: true });

module.exports = mongoose.models.Gig || mongoose.model('Gig', gigSchema);
