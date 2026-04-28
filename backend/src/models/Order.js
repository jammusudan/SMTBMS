const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    materialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
    },
    orderType: {
        type: String,
        enum: ['PURCHASE', 'SALE'],
        required: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: function() { return this.orderType === 'PURCHASE'; }
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: function() { return this.orderType === 'SALE'; }
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'PARTIAL'],
        default: 'PENDING'
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    paymentDate: {
        type: Date
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'UPI', 'Bank Transfer']
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING'
    },
    unitPrice: {
        type: Number,
        required: true,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdByRole: {
        type: String,
        enum: ['ADMIN', 'SALES', 'MANAGER', 'SYSTEM'],
        default: 'SYSTEM',
        required: true
    },
    createdByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
