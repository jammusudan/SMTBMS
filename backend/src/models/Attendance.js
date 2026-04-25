const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    employee_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    clock_in: {
        type: Date,
        required: true
    },
    clock_out: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Half Day', 'Late'],
        default: 'Present'
    }
}, { timestamps: true });

// Ensure an employee can only clock in once per day logically (via unique compound index)
// Note: Handled correctly via date string matching in controller, but DB enforcing is safer.
// attendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
