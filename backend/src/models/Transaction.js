const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    deal_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Deal',
        required: true
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Transaction amount must be positive']
    },
    payment_method: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'UPI', 'Check', 'Card'],
        default: 'Bank Transfer'
    },
    transaction_date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Completed', 'Pending', 'Failed', 'Refunded'],
        default: 'Completed'
    },
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
