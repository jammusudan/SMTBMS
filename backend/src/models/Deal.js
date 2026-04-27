const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: false
    },
    lead_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead'
    },
    prospect_name: String,
    prospect_email: String,
    prospect_phone: String,
    title: {
        type: String,
        required: [true, 'Deal title is required'],
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Deal amount must be positive']
    },
    materialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material'
    },
    quantity: {
        type: Number,
        default: 0
    },
    stage: {
        type: String,
        default: 'Prospecting'
    },
    lost_reason: {
        type: String,
        enum: ['Price', 'Competitor', 'No Need', 'Timing', 'Product Fit', 'Other']
    },
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expected_close_date: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Deal', dealSchema);
