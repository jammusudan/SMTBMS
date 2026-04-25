const ActivityLog = require('../models/ActivityLog');

// @desc    Get system logs
// @route   GET /api/logs
exports.getLogs = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        
        // Highly optimized query using the explicit createdAt -1 index
        const logs = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean(); // Lean for extreme read performance

        // Format to match previous SQL output expectations for React
        const formatted = logs.map(log => ({
            id: log._id,
            user_id: log.user_id,
            username: log.username,
            action: log.action,
            module: log.module,
            created_at: log.createdAt
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a system log
// @route   POST /api/logs
exports.createLog = async (req, res) => {
    try {
        const { action, module } = req.body;
        
        await ActivityLog.create({
            user_id: req.user.id,
            username: req.user.username || 'System',
            action,
            module
        });
        
        res.status(201).json({ message: 'Log created' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
