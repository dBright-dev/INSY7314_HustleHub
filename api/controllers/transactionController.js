/**
 * REFERENCES (IIE Harvard style)
 * - In-text: freelancer income aggregation follows the INSY7314 reporting/
 *   aggregation guidance (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

exports.getFreelancerIncome = async (req, res, next) => {
    try {
        const freelancerId = req.user.id || req.user.userId || req.user._id;
        const [summary] = await Transaction.aggregate([
            { $match: { freelancer: new mongoose.Types.ObjectId(String(freelancerId)) } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const transactions = await Transaction.find({ freelancer: freelancerId })
            .populate('booking', 'gig status').populate('client', 'name')
            .sort({ timestamp: -1 }).limit(20);
        return res.status(200).json({ success: true, data: { total: summary ? summary.total : 0, transactions } });
    } catch (error) { return next(error); }
};
