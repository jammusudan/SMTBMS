const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['Info', 'Warning', 'Urgent', 'Success', 'Error'],
        default: 'Info'
    },
    link: {
        type: String,
        trim: true
    },
    targetRole: {
        type: String,
        enum: ['Admin', 'Manager', 'Sales', 'Staff', 'All'],
        default: 'All'
    }
}, { timestamps: true });

// Optimize for fetching unread messages quickly
notificationSchema.index({ isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
