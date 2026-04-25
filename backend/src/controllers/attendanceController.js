const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// @desc    Clock In
// @route   POST /api/attendance/clock-in
exports.clockIn = async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0]; // HH:MM:SS
    
    try {
        // Find employee id for current user
        const employee = await Employee.findOne({ user_id: req.user.id });
        if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

        // Check if already clocked in for today (date > today and date < tomorrow)
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existing = await Attendance.findOne({
            employee_id: employee._id,
            date: { $gte: today, $lt: tomorrow }
        });

        if (existing) return res.status(400).json({ message: 'Already clocked in for today' });

        // Determine status (Late if after 09:30)
        let status = 'Present';
        if (timeString > '09:30:00') status = 'Late'; // basic string comparison works for HH:MM:SS

        await Attendance.create({
            employee_id: employee._id,
            date: today,
            clock_in: now,
            status
        });

        res.status(201).json({ message: 'Clocked in successfully', time: timeString, status });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Clock Out
// @route   PUT /api/attendance/clock-out
exports.clockOut = async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];

    try {
        const employee = await Employee.findOne({ user_id: req.user.id });
        if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

        const existing = await Attendance.findOne({
            employee_id: employee._id,
            date: { $gte: today, $lt: tomorrow }
        });

        if (!existing) return res.status(400).json({ message: 'You must clock in first' });
        if (existing.clock_out) return res.status(400).json({ message: 'Already clocked out for today' });

        existing.clock_out = now;
        await existing.save();

        res.json({ message: 'Clocked out successfully', time: timeString });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get attendance history
// @route   GET /api/attendance
exports.getAttendance = async (req, res) => {
    try {
        let matchQuery = {};

        // If not Admin/HR/Manager/Super Admin, show only own attendance
        const role = req.user.role;
        const hasOversight = ['Admin', 'HR', 'Manager', 'Super Admin'].includes(role);

        if (!hasOversight) {
            const employee = await Employee.findOne({ user_id: req.user.id });
            if (!employee) return res.json([]); // No profile, no attendance
            matchQuery.employee_id = employee._id;
        }

        const attendances = await Attendance.find(matchQuery)
            .populate({
                path: 'employee_id',
                select: 'first_name last_name',
                populate: {
                    path: 'dept_id',
                    select: 'name'
                }
            })
            .sort({ date: -1 });

        // Map it to match the expected format from previous SQL joins
        const formatted = attendances.map(a => ({
            id: a._id,
            date: a.date,
            clock_in: a.clock_in,
            clock_out: a.clock_out,
            status: a.status,
            first_name: a.employee_id?.first_name,
            last_name: a.employee_id?.last_name,
            department: a.employee_id?.dept_id?.name
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
