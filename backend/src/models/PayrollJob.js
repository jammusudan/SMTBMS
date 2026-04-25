const mongoose = require('mongoose');

const payrollJobSchema = new mongoose.Schema({
    batchId: {
        type: String,
        required: true,
        unique: true
    },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    type: {
        type: String,
        enum: ['Generation', 'Rollback'],
        default: 'Generation'
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Completed', 'Failed'],
        default: 'Pending'
    },
    progress: {
        total: { type: Number, default: 0 },
        processed: { type: Number, default: 0 },
        errors: [{
            employeeId: String,
            name: String,
            error: String
        }]
    },
    idempotencyKey: {
        type: String,
        unique: true,
        required: true
    },
    startedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    completedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('PayrollJob', payrollJobSchema);
