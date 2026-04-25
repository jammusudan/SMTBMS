const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Lead name is required'],
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
    source: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'In Progress', 'Negotiation', 'Won', 'Lost'],
        default: 'New'
    },
    notes: {
        type: String,
        trim: true
    },
    next_follow_up: {
        type: Date
    },
    estimatedValue: {
        type: Number,
        default: 0
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    context: {
        type: String,
        required: [true, 'Deal context is mandatory']
    },
    reviewDate: {
        type: Date
    },
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    converted_customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
