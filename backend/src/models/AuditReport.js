const mongoose = require('mongoose');

const auditReportSchema = new mongoose.Schema({
    auditor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    inventory_items: [{
        materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
        name: String,
        system_qty: Number,
        physical_qty: Number,
        discrepancy: Number,
        notes: String
    }],
    sales_items: [{
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
        customer: String,
        amount: Number, // Deal Value
        delivered_value: { type: Number, default: 0 },
        payment_status: { type: String, default: 'Pending' },
        status: String, // Delivery Status
        is_verified: { type: Boolean, default: false },
        mismatch_flag: { type: Boolean, default: false },
        notes: String
    }],
    activity_items: [{
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
        employee: String,
        task_name: String,
        status: String,
        is_verified: { type: Boolean, default: false }
    }],
    total_discrepancies: {
        type: Number,
        default: 0
    },
    summary: String,
    status: {
        type: String,
        enum: ['Review Required', 'Archived', 'Verified'],
        default: 'Review Required'
    }
}, { timestamps: true });

module.exports = mongoose.model('AuditReport', auditReportSchema);
