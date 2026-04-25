const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
    employee_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    version: { type: Number, default: 1 },
    
    // Breakdown
    basicSalary: { type: Number, required: true },
    hra: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    pf: { type: Number, default: 0 },
    monthlyTax: { type: Number, default: 0 },
    others: { type: Number, default: 0 },
    attendanceDeductions: { type: Number, default: 0 },
    
    // Attendance Metadata
    totalWorkingDays: Number,
    presentDays: Number,
    absentDays: Number,
    approvedLeaveDays: Number,

    // Financial Totals
    grossSalary: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },
    netPay: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    
    // Hardening & Idempotency
    batchId: { type: String, index: true },
    idempotencyKey: { type: String, unique: true, sparse: true },
    
    adjustments: [{
        type: { type: String, enum: ['Bonus', 'Deduction'] },
        amount: Number,
        reason: String,
        date: { type: Date, default: Date.now }
    }],

    status: {
        type: String,
        enum: ['Pending', 'Partially Paid', 'Paid', 'Reverted', 'Archived'],
        default: 'Pending'
    },
    paymentMethod: String,
    transactionId: String,
    isFrozen: { type: Boolean, default: false },
    
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paidAt: Date,

    auditLog: [{
        action: String,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        note: String
    }],
    
    // Emergency Rollback Context
    rolledBackBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rolledBackAt: { type: Date },
    rollbackReason: { type: String }
}, { timestamps: true });

// Prevent duplicate payroll for the same employee in the same period (Active records only)
// This allows re-running batch after a rollback (status: REVERTED)
salarySchema.index(
    { employee_id: 1, month: 1, year: 1 }, 
    { 
        unique: true, 
        partialFilterExpression: { 
            status: { $nin: ['Reverted', 'REVERTED'] } 
        } 
    }
);

module.exports = mongoose.model('Salary', salarySchema);
