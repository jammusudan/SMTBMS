const User = require('../models/User');

// @desc    Get all staff or filter by role
// @route   GET /api/staff
exports.getStaff = async (req, res) => {
    try {
        const { role } = req.query;
        let query = {};

        if (role && role !== 'all') {
            // Case-insensitive role filtering
            query.role = { $regex: new RegExp(`^${role}$`, 'i') };
        }

        const staff = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        const formattedStaff = staff.map(user => ({
            _id: user._id,
            name: user.username,
            email: user.email,
            role: user.role,
            status: user.status || 'Active', // Fallback for old records
            createdAt: user.createdAt
        }));

        res.status(200).json(formattedStaff);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Error fetching staff data' });
    }
};

// @desc    Update staff status
// @route   PATCH /api/staff/:id/status
exports.updateStaffStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Error updating status' });
    }
};
