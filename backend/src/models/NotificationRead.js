const mongoose = require('mongoose');

const notificationReadSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notificationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification',
        required: true
    },
    isRead: {
        type: Boolean,
        default: true
    },
    readAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure a user only has one read record per notification
notificationReadSchema.index({ userId: 1, notificationId: 1 }, { unique: true });

module.exports = mongoose.model('NotificationRead', notificationReadSchema);
