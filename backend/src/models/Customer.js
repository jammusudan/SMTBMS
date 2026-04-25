const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    adminApproved: {
        type: Boolean,
        default: false
    },
    managerApproved: {
        type: Boolean,
        default: false
    },
    isApproved: { // Final status
        type: Boolean,
        default: false
    },
    adminApprovedAt: Date,
    adminApprovedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    managerApprovedAt: Date,
    managerApprovedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
