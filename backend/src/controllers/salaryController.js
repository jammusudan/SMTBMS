const Salary = require('../models/Salary');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const PayrollJob = require('../models/PayrollJob');
const payrollConfig = require('../config/payrollConfig');
const logger = require('../utils/logger');
const { generateNotification } = require('./notificationController');

/**
 * Helper: Get UTC Date boundaries
 */
const getUTCDates = (year, month) => {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return { start, end, days };
};

// @desc    Get all salaries (with pagination & employee isolation)
// @route   GET /api/salaries
exports.getSalaries = async (req, res) => {
    try {
        const { month, year, page = 1, limit = 10 } = req.query;
        let query = {};
        if (month) query.month = Number(month);
        if (year) query.year = Number(year);

        if (req.user.role === 'Employee') {
            const emp = await Employee.findOne({ user_id: req.user.id });
            if (!emp) return res.json({ salaries: [], total: 0 });
            query.employee_id = emp._id;
        }

        const skip = (Number(page) - 1) * Number(limit);
        
        const total = await Salary.countDocuments(query);
        const salaries = await Salary.find(query)
            .populate({
                path: 'employee_id',
                select: 'first_name last_name designation dept_id',
                populate: { path: 'dept_id', select: 'name' }
            })
        res.json({ 
            salaries, 
            total, 
            page: Number(page), 
            pages: Math.ceil(total / limit),
            stats: {
                totalNetPay: await Salary.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: '$netPay' } } }]).then(r => r[0]?.total || 0),
                totalPaid: await Salary.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: '$paidAmount' } } }]).then(r => r[0]?.total || 0)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Internal Worker: Process Payroll Batch Asynchronously
 */
const runBatchWorker = async (jobId) => {
    const job = await PayrollJob.findById(jobId);
    if (!job) return;

    try {
        job.status = 'Processing';
        await job.save();

        const { month, year } = job;
        const { start: startDate, end: endDate, days: daysInMonth } = getUTCDates(year, month);
        
        const employees = await Employee.find().populate('dept_id');
        job.progress.total = employees.length;
        await job.save();

        // 🟢 Bulk Aggregation (Optimization: Fetch all once)
        const allAttendance = await Attendance.find({ date: { $gte: startDate, $lte: endDate } });
        const allLeaves = await Leave.find({ status: 'Approved', $or: [{ fromDate: { $lte: endDate }, toDate: { $gte: startDate } }] });

        for (const emp of employees) {
            try {

                // 1. Calculate Attendance from bulk data
                const empAttendance = allAttendance.filter(a => a.employee_id.toString() === emp._id.toString());
                const presentDays = empAttendance.reduce((acc, curr) => 
                    acc + (curr.status === 'Present' ? 1 : curr.status === 'Half Day' ? 0.5 : 0), 0
                );

                // 2. Calculate Leaves from bulk data
                const empLeaves = allLeaves.filter(l => l.employeeId.toString() === emp._id.toString());
                let approvedLeaveDays = 0;
                empLeaves.forEach(l => {
                    const start = l.fromDate < startDate ? startDate : l.fromDate;
                    const end = l.toDate > endDate ? endDate : l.toDate;
                    const diffTime = Math.abs(end - start);
                    approvedLeaveDays += (Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1) * (l.isHalfDay ? 0.5 : 1);
                });

                // 3. Financial Calculation
                // Rule: If today is within the calculation month, only count days up to today
                const isCurrentMonth = new Date().getMonth() + 1 === month && new Date().getFullYear() === year;
                const calculationDays = isCurrentMonth ? new Date().getUTCDate() : daysInMonth;

                // Duplicate & Versioning Check
                const versions = await Salary.find({ employee_id: emp._id, month, year }).sort({ version: -1 });
                const existingActive = versions.find(v => !['Reverted', 'REVERTED'].includes(v.status));
                
                if (existingActive) {
                    job.progress.processed++;
                    await job.save();
                    continue;
                }

                // Incremental versioning if re-running after rollback
                const nextVersion = versions.length > 0 ? (versions[0].version + 1) : 1;

                // Use flat salary as fallback if detailed structure isn't set
                const basicSalaryFallback = emp.salaryStructure?.basicSalary || emp.salary || 0;

                // STRICT RULE: No payroll without configuration or identity
                if (basicSalaryFallback <= 0) {
                    job.progress.processed++;
                    await job.save();
                    continue; 
                }

                if (!emp.employeeCode) {
                    job.progress.errors.push({ employeeId: emp._id, name: emp.first_name, error: 'Missing Employee Code' });
                    job.progress.processed++;
                    await job.save();
                    continue;
                }

                let effectiveAbsentDays = 0;
                if (empAttendance.length > 0 || !isCurrentMonth) {
                    effectiveAbsentDays = Math.max(0, calculationDays - (presentDays + approvedLeaveDays));
                }

                const struct = {
                    basicSalary: basicSalaryFallback,
                    hra: emp.salaryStructure?.hra || 0,
                    allowances: emp.salaryStructure?.allowances || 0,
                    bonus: emp.salaryStructure?.bonus || 0,
                    pfPercent: emp.salaryStructure?.pfPercent || 12,
                    taxPercent: emp.salaryStructure?.taxPercent || 0
                };
                
                // Deduction Guardrails
                if (struct.pfPercent < 12 || struct.pfPercent > 15) {
                    logger.warn(`Non-standard PF Rate (${struct.pfPercent}%) for employee ${emp.employeeCode}`);
                }

                const perDaySalary = struct.basicSalary / daysInMonth;
                const attendanceDeductions = Math.trunc(effectiveAbsentDays * perDaySalary);
                
                const grossSalary = struct.basicSalary + struct.hra + struct.allowances + struct.bonus;
                
                const pfDeduction = Math.trunc(struct.basicSalary * (struct.pfPercent / 100));
                const monthlyTax = Math.trunc(grossSalary * (struct.taxPercent / 100));
                
                const totalDeductions = pfDeduction + monthlyTax + attendanceDeductions;
                const netPay = Math.max(0, grossSalary - totalDeductions);

                // High Deduction Warning
                if (totalDeductions > (grossSalary * 0.6)) {
                    logger.warn(`Unusually high deductions (>60% gross) for ${emp.employeeCode}. Total: ${totalDeductions}, Gross: ${grossSalary}`);
                }

                await Salary.create({
                    employee_id: emp._id,
                    month, year,
                    version: nextVersion,
                    batchId: job.batchId,
                    basicSalary: struct.basicSalary,
                    hra: struct.hra,
                    allowances: struct.allowances,
                    pf: pfDeduction,
                    monthlyTax,
                    others: 0,
                    attendanceDeductions,
                    totalWorkingDays: daysInMonth,
                    presentDays, 
                    absentDays: effectiveAbsentDays, 
                    approvedLeaveDays,
                    grossSalary, 
                    totalDeductions, 
                    netPay,
                    generatedBy: job.startedBy,
                    auditLog: [{
                        action: 'Initial Generation',
                        userId: job.startedBy,
                        note: `Batch ${job.batchId} created version ${nextVersion}`
                    }]
                });

                job.progress.processed++;
                if (job.progress.processed % 5 === 0) await job.save(); // Throttle saves
            } catch (err) {
                job.progress.errors.push({ employeeId: emp._id, name: emp.first_name, error: err.message });
                logger.error(`[PayrollJob ${job._id}] Error processing employee ${emp._id}: ${err.message}`);
            }
        }

        job.status = 'Completed';
        job.completedAt = new Date();
        await job.save();

        // Notify Admin
        await generateNotification(
            'Payroll Batch Complete',
            `Batch ${job.batchId} finished. Created: ${job.progress.processed}, Errors: ${job.progress.errors.length}`,
            'Info'
        );

    } catch (error) {
        job.status = 'Failed';
        job.progress.errors.push({ employeeId: null, error: error.message });
        await job.save();
        logger.error(`[PayrollJob ${job._id}] FATAL ERROR: ${error.message}`, { stack: error.stack });
    }
};

// @desc    Batch generate payroll (Async Trigger)
// @route   POST /api/salaries/batch
exports.batchGenerate = async (req, res) => {
    const { month, year, idempotencyKey } = req.body;
    if (!month || !year || !idempotencyKey) return res.status(400).json({ message: 'Month, year and idempotency key are required' });

    try {
        const existingJob = await PayrollJob.findOne({ idempotencyKey });
        if (existingJob) return res.status(200).json(existingJob);

        const batchId = `PAY-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
        
        const job = await PayrollJob.create({
            batchId,
            month: Number(month),
            year: Number(year),
            idempotencyKey,
            startedBy: req.user.id,
            status: 'Pending'
        });

        // Trigger worker in background
        setImmediate(() => runBatchWorker(job._id));

        res.status(202).json({ 
            message: 'Payroll generation started', 
            jobId: job._id, 
            batchId 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Job Status
// @route   GET /api/salaries/jobs/:id
exports.getJobStatus = async (req, res) => {
    try {
        const job = await PayrollJob.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Salary Adjustments
// @route   PATCH /api/salaries/:id/adjustments
exports.addAdjustment = async (req, res) => {
    const { type, amount, reason } = req.body;
    try {
        const salary = await Salary.findById(req.params.id);
        if (!salary) return res.status(404).json({ message: 'Record not found' });
        if (salary.status === 'Paid') return res.status(400).json({ message: 'Cannot adjust a paid salary' });
        if (salary.isFrozen && req.user.role !== 'Admin') return res.status(403).json({ message: 'Record is frozen. Admin re-open required.' });

        salary.adjustments.push({ type, amount: Number(amount), reason, date: new Date() });
        
        // Recalculate
        const adjTotal = salary.adjustments.reduce((acc, curr) => 
            acc + (curr.type === 'Bonus' ? curr.amount : -curr.amount), 0
        );
        
        salary.netPay = Math.max(0, (salary.grossSalary - salary.totalDeductions) + adjTotal);
        salary.auditLog.push({ action: 'Adjustment Added', userId: req.user.id, note: `${type}: ${amount} - ${reason}` });
        
        await salary.save();
        res.json(salary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Process payment (Full or Partial) with Idempotency & Concurrency
// @route   PUT /api/salaries/:id/payment
exports.processPayment = async (req, res) => {
    const { amount, method, transactionId, idempotencyKey } = req.body;
    if (!idempotencyKey) return res.status(400).json({ message: 'Idempotency key required' });

    try {
        const salary = await Salary.findById(req.params.id).populate('employee_id');
        if (!salary) return res.status(404).json({ message: 'Record not found' });
        
        // 🔒 Check for duplicate payment via audit log or idempotency key
        if (salary.auditLog.some(log => log.note.includes(idempotencyKey))) {
            return res.json(salary);
        }

        const payAmount = Number(amount);
        if (isNaN(payAmount) || payAmount <= 0) return res.status(400).json({ message: 'Invalid amount' });

        // 🔄 Optimistic Concurrency Control (Mongoose versioning)
        salary.paidAmount += payAmount;
        salary.paymentMethod = method;
        salary.transactionId = transactionId;
        salary.processedBy = req.user.id;
        salary.paidAt = new Date();

        if (salary.paidAmount >= salary.netPay) {
            salary.status = 'Paid';
        } else {
            salary.status = 'Partially Paid';
        }

        salary.auditLog.push({ 
            action: 'Payment Processed', 
            userId: req.user.id, 
            note: `Key: ${idempotencyKey} | Paid ${payAmount} via ${method}. Total: ${salary.paidAmount}/${salary.netPay}` 
        });

        // Use findOneAndUpdate with version check if manual save is risky
        await salary.save();

        // Notification
        await generateNotification(
            'Salary Disbursed',
            `Your salary for ${salary.month}/${salary.year} has been ${salary.status === 'Paid' ? 'fully disbursed' : 'partially paid'}.`,
            'Success'
        );

        res.json(salary);
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Conflict detected. Please refresh and retry.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Safe Rollback (Soft-Delete)
// @route   POST /api/salaries/rollback/:batchId
exports.rollbackBatch = async (req, res) => {
    const { batchId } = req.params;
    const { reason } = req.body;

    try {
        // Enforce RBAC: Admin only
        if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required for rollbacks' });

        // Update all Pending/Partially Paid records in this batch to Reverted
        const result = await Salary.updateMany(
            { batchId, status: { $ne: 'Paid' } },
            { 
                $set: { 
                    status: 'Reverted', 
                    isFrozen: true,
                    rolledBackBy: req.user.id,
                    rolledBackAt: new Date(),
                    rollbackReason: reason
                },
                $push: { auditLog: { action: 'Batch Rollback', userId: req.user.id, note: `Soft-delete: ${reason}` } }
            }
        );

        res.json({ 
            message: 'Batch rollback complete', 
            revertedCount: result.modifiedCount,
            note: 'Paid records were preserved and cannot be reverted.'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Emergency Monthly Rollback
// @route   POST /api/payroll/rollback
exports.emergencyRollback = async (req, res) => {
    const { month, year, reason } = req.body;
    if (!month || !year || !reason) return res.status(400).json({ message: 'Month, year and reason are required' });

    try {
        // Enforce RBAC: Admin/HR only
        if (!['Admin', 'HR'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized: Admin or HR access required' });
        }

        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthNum = typeof month === 'string' ? months.indexOf(month) + 1 : month;

        if (monthNum < 1 || monthNum > 12) return res.status(400).json({ message: 'Invalid month' });

        // Safely rollback all non-paid records for the month/year
        const result = await Salary.updateMany(
            { 
                month: monthNum, 
                year: Number(year), 
                status: { $nin: ['Paid', 'REVERTED'] } 
            },
            { 
                $set: { 
                    status: 'REVERTED', 
                    isFrozen: true,
                    rolledBackBy: req.user.id,
                    rolledBackAt: new Date(),
                    rollbackReason: reason
                },
                $push: { 
                    auditLog: { 
                        action: 'Emergency Rollback', 
                        userId: req.user.id, 
                        note: `Month: ${month}, Year: ${year}. Reason: ${reason}` 
                    } 
                }
            }
        );

        res.json({ 
            message: 'Payroll successfully rolled back', 
            revertedCount: result.modifiedCount,
            note: 'Already paid or reverted records were skipped.'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin Re-open
// @route   POST /api/salaries/:id/re-open
exports.adminReOpen = async (req, res) => {
    try {
        const salary = await Salary.findById(req.params.id);
        if (!salary) return res.status(404).json({ message: 'Record not found' });
        if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });

        if (salary.status === 'Reverted') return res.status(400).json({ message: 'Cannot re-open a reverted record' });

        salary.isFrozen = false;
        salary.version += 1;
        salary.auditLog.push({ action: 'Record Re-opened', userId: req.user.id, note: `Revision v${salary.version} started` });
        
        await salary.save();
        res.json({ message: 'Record re-opened for adjustments', salary });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch single slip details (with Owner check)
exports.getSalaryById = async (req, res) => {
    try {
        const salary = await Salary.findById(req.params.id)
            .populate({
                path: 'employee_id',
                select: 'first_name last_name designation dept_id user_id',
                populate: { path: 'dept_id', select: 'name' }
            });
        
        if (!salary) return res.status(404).json({ message: 'Record not found' });

        // Ownership Check
        if (req.user.role === 'Employee') {
            if (salary.employee_id.user_id.toString() !== req.user.id.toString()) {
                logger.warn(`Unauthorized salary access attempt by ${req.user.id} on record ${req.params.id}`);
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        res.json(salary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Log payslip download/print
exports.logDownload = async (req, res) => {
    try {
        const salary = await Salary.findById(req.params.id).populate('employee_id');
        if (!salary) return res.status(404).json({ message: 'Record not found' });

        // Security
        if (req.user.role === 'Employee' && salary.employee_id.user_id.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        salary.auditLog.push({
            action: 'Payslip Downloaded',
            userId: req.user.id,
            note: `PDF/Print generated via ${req.headers['user-agent']}`,
            date: new Date()
        });
        await salary.save();
        
        logger.info(`Payslip downloaded for ${salary.month}/${salary.year} by user ${req.user.id}`);
        res.json({ message: 'Download logged' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Process Salary Payment (Lock record)
// @route   POST /api/salaries/:id/pay
exports.processPayment = async (req, res) => {
    const { paymentMethod, transactionId } = req.body;
    try {
        const salary = await Salary.findById(req.params.id);
        if (!salary) return res.status(404).json({ message: 'Payroll record not found' });

        if (salary.status === 'Paid' || salary.status === 'PAID') {
            return res.status(400).json({ message: 'Payroll is already marked as Paid' });
        }

        if (salary.status === 'REVERTED' || salary.status === 'Reverted') {
            return res.status(400).json({ message: 'Cannot pay a reverted record. Re-run batch first.' });
        }

        salary.status = 'Paid';
        salary.isFrozen = true;
        salary.paidAt = new Date();
        salary.processedBy = req.user.id;
        salary.paymentMethod = paymentMethod || 'Bank Transfer';
        salary.transactionId = transactionId || `TXN-${Date.now()}`;
        salary.paidAmount = salary.netPay;

        salary.auditLog.push({
            action: 'Payment Processed',
            userId: req.user.id,
            note: `Confirmed payment via ${salary.paymentMethod}. Ref: ${salary.transactionId}`
        });

        await salary.save();

        res.json({ message: 'Payment successfully processed and record locked.', salary });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = exports;
