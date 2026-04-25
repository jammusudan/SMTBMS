const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const ActivityLog = require('../models/ActivityLog');
const { generateNotification } = require('./notificationController');

/**
 * Helper: Calculate total business days between dates
 */
const calculateDays = (start, end, isHalfDay) => {
    if (isHalfDay) return 0.5;
    const diffTime = Math.abs(new Date(end) - new Date(start));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Helper: Check for overlapping approved leaves
 */
const checkOverlap = async (employeeId, from, to) => {
    const overlap = await Leave.findOne({
        employeeId,
        status: 'Approved',
        $or: [
            { fromDate: { $lte: to }, toDate: { $gte: from } }
        ]
    });
    return !!overlap;
};

// @desc    Apply for leave
// @route   POST /api/leaves
exports.applyLeave = async (req, res) => {
    const { type, fromDate, toDate, reason, isHalfDay, halfDayType } = req.body;
    
    if (!reason) return res.status(400).json({ message: 'Leave reason is mandatory' });
    if (new Date(fromDate) > new Date(toDate)) {
        return res.status(400).json({ message: 'End date cannot be before start date' });
    }

    try {
        const employee = await Employee.findOne({ user_id: req.user.id });
        if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
        
        const leave = await Leave.create({
            employeeId: employee._id,
            leaveType: type,
            fromDate,
            toDate,
            isHalfDay: !!isHalfDay,
            halfDayType,
            reason
        });
        
        res.status(201).json({ id: leave._id, message: 'Leave application submitted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get leave history with advanced filters
// @route   GET /api/leaves
exports.getLeaves = async (req, res) => {
    try {
        const { status, type, search, startDate, endDate } = req.query;
        let query = {};

        // Role-based scoping
        if (req.user.role !== 'Admin' && req.user.role !== 'HR' && req.user.role !== 'Manager') {
            const employee = await Employee.findOne({ user_id: req.user.id });
            if (!employee) return res.json([]);
            query.employeeId = employee._id;
        }

        if (status && status !== 'All') query.status = status;
        if (type && type !== 'All') query.leaveType = type;
        if (startDate && endDate) {
            query.fromDate = { $gte: new Date(startDate) };
            query.toDate = { $lte: new Date(endDate) };
        }

        let leaves = await Leave.find(query)
            .populate({
                path: 'employeeId',
                select: 'first_name last_name dept_id',
                populate: { path: 'dept_id', select: 'name' }
            })
            .populate('reviewedBy', 'username')
            .sort({ createdAt: -1 });

        // Filter by employee name if search provided (manual filter as names are across two fields)
        if (search) {
            const lowSearch = search.toLowerCase();
            leaves = leaves.filter(l => 
                l.employeeId?.first_name?.toLowerCase().includes(lowSearch) || 
                l.employeeId?.last_name?.toLowerCase().includes(lowSearch)
            );
        }

        const formatted = leaves.map(l => ({
            id: l._id,
            employeeName: `${l.employeeId?.first_name} ${l.employeeId?.last_name}`,
            department: l.employeeId?.dept_id?.name,
            leaveType: l.leaveType,
            fromDate: l.fromDate,
            toDate: l.toDate,
            isHalfDay: l.isHalfDay,
            halfDayType: l.halfDayType,
            reason: l.reason,
            status: l.status,
            days: calculateDays(l.fromDate, l.toDate, l.isHalfDay),
            appliedAt: l.createdAt,
            reviewedBy: l.reviewedBy?.username,
            reviewedAt: l.reviewedAt
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update leave status (Approve/Reject/Cancel)
// @route   PUT /api/leaves/:id/status
exports.updateLeaveStatus = async (req, res) => {
    const { status } = req.body;
    const leaveId = req.params.id;

    try {
        const leave = await Leave.findById(leaveId).populate('employeeId');
        if (!leave) return res.status(404).json({ message: 'Leave request not found' });

        const oldStatus = leave.status;
        const employee = leave.employeeId;

        // 1. Strict State Transitions & Lock Check
        if (oldStatus === 'Approved' && status !== 'Cancelled') {
            return res.status(400).json({ message: 'Approved leaves are locked. Only cancellation is allowed.' });
        }
        if (oldStatus !== 'Pending' && status === 'Approved') {
            return res.status(400).json({ message: 'Only pending requests can be approved.' });
        }
        if (oldStatus === 'Cancelled') {
            return res.status(400).json({ message: 'Cannot modify a cancelled leave.' });
        }

        // 2. Business Logic for Approval
        if (status === 'Approved') {
            // Overlap Validation
            const hasOverlap = await checkOverlap(leave.employeeId, leave.fromDate, leave.toDate);
            if (hasOverlap) return res.status(400).json({ message: 'Conflicting approved leave exists for this employee.' });

            // Balance Check
            const days = calculateDays(leave.fromDate, leave.toDate, leave.isHalfDay);
            const balanceKey = leave.leaveType.split(' ')[0].toLowerCase(); // 'sick', 'casual', 'privilege'
            
            if (balanceKey !== 'unpaid') {
                if (employee.leaveBalances[balanceKey] < days) {
                    return res.status(400).json({ message: `Insufficient ${leave.leaveType} balance. Remaining: ${employee.leaveBalances[balanceKey]} days.` });
                }
                // Deduct Balance
                employee.leaveBalances[balanceKey] -= days;
                await employee.save();
            }
        }

        // 3. Business Logic for Cancellation (Restoration)
        if (status === 'Cancelled' && oldStatus === 'Approved') {
            const days = calculateDays(leave.fromDate, leave.toDate, leave.isHalfDay);
            const balanceKey = leave.leaveType.split(' ')[0].toLowerCase();
            if (balanceKey !== 'unpaid') {
                employee.leaveBalances[balanceKey] += days;
                await employee.save();
            }
        }

        // 4. Persistence & Audit Log
        leave.status = status;
        leave.reviewedBy = req.user.id;
        leave.reviewedAt = new Date();
        await leave.save();

        await ActivityLog.create({
            user_id: req.user.id,
            username: req.user.username || 'System',
            action: `Leave request ${status} for ${employee.first_name}`,
            module: 'HRMS'
        });

        // 5. Notification
        await generateNotification(
            `Leave ${status}`,
            `The leave request (${leave.leaveType}) for ${employee.first_name} ${employee.last_name} has been ${status.toLowerCase()}.`,
            status === 'Approved' ? 'Success' : status === 'Rejected' ? 'Error' : 'Warning'
        );

        res.json({ message: `Leave ${status} successfully`, leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk Update leave status
// @route   POST /api/leaves/bulk
exports.bulkUpdateStatus = async (req, res) => {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ message: 'Invalid request' });

    try {
        const results = { success: 0, failed: 0, errors: [] };
        
        for (const id of ids) {
            try {
                // We reuse the update logic to ensure all checks (balance, overlap) run per record
                // In a production env, this might be optimized with sessions/transactions
                req.params.id = id;
                await exports.updateLeaveStatus(req, {
                    json: () => results.success++,
                    status: () => ({ json: (err) => { results.failed++; results.errors.push(err.message); } })
                });
            } catch (err) {
                results.failed++;
                results.errors.push(err.message);
            }
        }
        
        res.json({ message: 'Bulk processing complete', ...results });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
