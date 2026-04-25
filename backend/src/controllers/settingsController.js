const User = require('../models/User');

// @desc    Get all users with their roles (Admin only)
// @route   GET /api/settings/users
exports.getUsersWithRoles = async (req, res) => {
    try {
        const users = await User.find()
            .select('username email role createdAt')
            .sort({ role: 1, username: 1 })
            .lean();

        const formatted = users.map(u => ({
            id: u._id,
            username: u.username,
            email: u.email,
            role: u.role,
            created_at: u.createdAt
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/settings/users/role
exports.updateUserRole = async (req, res) => {
    const { userId, role } = req.body;
    
    // Safety check - Admin cannot demote themselves easily here without extra checks
    if (req.user.id === userId) {
        return res.status(400).json({ message: "Cannot change your own role through this interface." });
    }

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, runValidators: true }
        );

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'Role updated successfully', role: user.role });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
