const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    sales_person_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    total_amount: {
        type: Number,
        required: true,
        min: [0, 'Total amount must be positive']
    }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
