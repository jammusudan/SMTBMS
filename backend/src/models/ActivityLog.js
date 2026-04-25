const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    action: {
        type: String,
        required: true,
        trim: true
    },
    module: {
        type: String,
        required: true,
        enum: ['Materials', 'HRMS', 'ERP', 'CRM', 'Auth', 'Settings', 'Dashboard', 'SALES'],
    }
}, { timestamps: true });

// Optimize for fetching recent logs globally
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
