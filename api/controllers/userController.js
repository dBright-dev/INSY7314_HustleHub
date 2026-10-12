/**
 * REFERENCES (IIE Harvard style)
 * - In-text: self-or-admin profile access control follows the INSY7314
 *   authorisation guidance (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

// controllers/userController.js — Mongoose-backed (replaces legacy file-store userModel)
const User = require('../models/User');

class UserController {
    async getAllUsers(req, res, next) {
        try {
            const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: users });
        } catch (error) { next(error); }
    }

    async getUserById(req, res, next) {
        try {
            const { id } = req.params;
            const requesterId = String(req.user._id || req.user.id);
            if (requesterId !== String(id) && req.user.role !== 'Admin') {
                return res.status(403).json({ success: false, message: 'Access denied. You can only view your own profile.' });
            }
            const user = await User.findById(id).select('-passwordHash');
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            res.status(200).json({ success: true, data: user });
        } catch (error) { next(error); }
    }

    async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            const requesterId = String(req.user._id || req.user.id);
            if (requesterId !== String(id) && req.user.role !== 'Admin') {
                return res.status(403).json({ success: false, message: 'Access denied. You can only update your own profile.' });
            }
            const { name, role } = req.body;
            const updates = {};
            if (name !== undefined) updates.name = name;
            // Only admins may change roles
            if (role !== undefined) {
                if (req.user.role !== 'Admin') {
                    return res.status(403).json({ success: false, message: 'Only admins can change roles.' });
                }
                updates.role = role;
            }
            const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-passwordHash');
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            res.status(200).json({ success: true, message: 'User profile updated successfully', data: user });
        } catch (error) { next(error); }
    }

    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;
            const requesterId = String(req.user._id || req.user.id);
            if (requesterId === String(id)) {
                return res.status(400).json({ success: false, message: 'You cannot delete your own account through this endpoint.' });
            }
            const deleted = await User.findByIdAndDelete(id);
            if (!deleted) return res.status(404).json({ success: false, message: 'User not found' });
            res.status(200).json({ success: true, message: 'User deleted successfully' });
        } catch (error) { next(error); }
    }
}

module.exports = new UserController();
