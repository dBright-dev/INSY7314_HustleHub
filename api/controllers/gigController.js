/**
 * REFERENCES (IIE Harvard style)
 * - In-text: owner-only gig update/delete (403 for non-owners) follows the
 *   INSY7314 authorisation/ownership guidance (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Gig = require('../models/Gig');

const currentUserId = req => req.user && (req.user.id || req.user.userId || req.user._id);
const badId = id => !mongoose.Types.ObjectId.isValid(id);
const checkValidation = (req, res) => {
    const result = validationResult(req);
    if (result.isEmpty()) return false;
    res.status(400).json({ success: false, message: 'Validation failed', errors: result.array() });
    return true;
};

exports.createGig = async (req, res, next) => {
    try {
        if (checkValidation(req, res)) return;
        const gig = await Gig.create({ ...req.body, owner: currentUserId(req) });
        return res.status(201).json({ success: true, data: gig });
    } catch (error) { return next(error); }
};

exports.getAllGigs = async (req, res, next) => {
    try {
        const gigs = await Gig.find({ status: 'available' }).populate('owner', 'name');
        return res.status(200).json({ success: true, data: gigs });
    } catch (error) { return next(error); }
};

exports.getGigById = async (req, res, next) => {
    try {
        if (badId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid gig ID' });
        const gig = await Gig.findOne({ _id: req.params.id, status: 'available' }).populate('owner', 'name');
        if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });
        return res.status(200).json({ success: true, data: gig });
    } catch (error) { return next(error); }
};

exports.updateGig = async (req, res, next) => {
    try {
        if (checkValidation(req, res)) return;
        if (badId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid gig ID' });
        const gig = await Gig.findById(req.params.id);
        if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });
        if (gig.owner.toString() !== String(currentUserId(req))) return res.status(403).json({ success: false, message: 'You do not own this gig' });
        const allowed = ['title', 'description', 'category', 'price', 'status'];
        for (const key of allowed) if (Object.prototype.hasOwnProperty.call(req.body, key)) gig[key] = req.body[key];
        await gig.save();
        return res.status(200).json({ success: true, data: gig });
    } catch (error) { return next(error); }
};

exports.deleteGig = async (req, res, next) => {
    try {
        if (badId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid gig ID' });
        const gig = await Gig.findById(req.params.id);
        if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });
        if (gig.owner.toString() !== String(currentUserId(req))) return res.status(403).json({ success: false, message: 'You do not own this gig' });
        await gig.deleteOne();
        return res.status(200).json({ success: true, message: 'Gig deleted successfully' });
    } catch (error) { return next(error); }
};

exports.getMyGigs = async (req, res, next) => {
    try {
        const gigs = await Gig.find({ owner: currentUserId(req) }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: gigs });
    } catch (error) { return next(error); }
};
