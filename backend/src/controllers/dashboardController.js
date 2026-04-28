const Material = require('../models/Material');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Order = require('../models/Order');
const Sale = require('../models/Sale');
const Leave = require('../models/Leave');
const Notification = require('../models/Notification');
const Task = require('../models/Task');
const Department = require('../models/Department');
const Salary = require('../models/Salary');
const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/stats
exports.getStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Run all standalone queries entirely in parallel for huge performance gains
        const [
            totalMaterials,
            materialsSnapshot,
            outOfStock,
            
            totalEmployees,
            attendancesToday,
            
            totalOrders,
            ordersSummary,

            salesSummary,
            
            pendingTasks,
            activeOrders,

            totalLeads,
            wonLeads,
            monthlyLeads,
            activeDeals
        ] = await Promise.all([
            Material.countDocuments(),
            Material.find({}, 'quantity min_stock_level').lean(),
            Material.countDocuments({ quantity: { $lte: 0 } }),

            Employee.countDocuments(),
            Attendance.find({ date: { $gte: today, $lt: tomorrow } }, 'status').lean(),

            Order.countDocuments(),
            Order.aggregate([
                {
                    $group: {
                        _id: "$status",
                        totalAmount: { $sum: "$total_amount" }
                    }
                }
            ]),

            Order.aggregate([
                { $match: { orderType: 'SALE', status: 'COMPLETED' } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$totalAmount" }
                    }
                }
            ]),

            Task.countDocuments({ status: { $ne: 'Completed' } }),
            Order.countDocuments({ status: { $in: ['Pending', 'Processing', 'Shipped'] } }),

            Lead.countDocuments(),
            Lead.countDocuments({ status: 'Won' }),
            Lead.countDocuments({ createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }),
            Lead.countDocuments({ status: { $nin: ['Won', 'Lost'] } })
        ]);

        // Process Materials
        let lowStockCount = 0;
        materialsSnapshot.forEach(m => {
            if (m.quantity < m.min_stock_level && m.quantity > 0) lowStockCount++;
        });

        // Process Attendances
        let presentCount = 0;
        let absentCount = 0;
        let halfDayCount = 0;
        attendancesToday.forEach(a => {
            if (a.status === 'Present') presentCount++;
            if (a.status === 'Absent') absentCount++;
            if (a.status === 'Half Day') halfDayCount++;
        });

        // Process ERP Orders
        let pendingAmount = 0;
        let receivedAmount = 0;
        ordersSummary.forEach(o => {
            if (o._id === 'Pending') pendingAmount = o.totalAmount;
            if (o._id === 'Received') receivedAmount = o.totalAmount;
        });

        // Process CRM Sales
        const totalRevenue = salesSummary.length > 0 ? salesSummary[0].totalRevenue : 0;

        // Construct final payload
        res.json({
            materials: {
                total_items: totalMaterials,
                low_stock_count: lowStockCount,
                out_of_stock_count: outOfStock
            },
            employees: {
                total: totalEmployees,
                attendance_today: [
                    { status: 'Present', count: presentCount },
                    { status: 'Absent', count: absentCount },
                    { status: 'Half Day', count: halfDayCount }
                ],
                pending_tasks: pendingTasks
            },
            erp: {
                total_orders: totalOrders,
                active_orders: activeOrders,
                pending_amount: pendingAmount,
                received_amount: receivedAmount
            },
            crm: {
                revenue: totalRevenue,
                leads_count: totalLeads,
                won_leads: wonLeads,
                monthly_leads: monthlyLeads,
                active_deals: activeDeals,
                conversion_rate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0
            },
            finances: {
                monthly_payout: await Salary.aggregate([
                    { $match: { 
                        month: new Date().getMonth() + 1, 
                        year: new Date().getFullYear() 
                    } },
                    { $group: { _id: null, total: { $sum: "$netPay" } } }
                ]).then(res => res[0]?.total || 0)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard summary statistics for HR
// @route   GET /api/dashboard/hr/stats
exports.getHRStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch standalone collections using performant independent promises
        const [
            totalEmployees,
            attendancesToday,
            recentLeaves,
            pendingLeaveCount,
            departments,
            recentSalaries,
            recentActivities
        ] = await Promise.all([
            Employee.countDocuments(),
            Attendance.find({ date: { $gte: today, $lt: tomorrow } }, 'status').lean(),
            Leave.find({ status: 'Pending' })
                .populate({ path: 'employee_id', select: 'first_name last_name' })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            Leave.countDocuments({ status: 'Pending' }),
            Task.countDocuments({ status: { $ne: 'Completed' } }),
            Department.find().lean(),
            Salary.find()
                .populate({ 
                    path: 'employee_id', 
                    select: 'first_name last_name',
                    populate: { path: 'dept_id', select: 'name' }
                })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            ActivityLog.find({ module: 'HRMS' })
                .sort({ createdAt: -1 })
                .limit(8)
                .lean()
        ]);

        let presentCount = 0;
        let absentCount = 0;
        let halfDayCount = 0;

        attendancesToday.forEach(a => {
            if (a.status === 'Present') presentCount++;
            if (a.status === 'Absent') absentCount++;
            if (a.status === 'Half Day') halfDayCount++;
        });

        // Department Distribution with extra logic
        const deptDistribution = await Promise.all(departments.map(async (dept) => {
            const [count, onLeave] = await Promise.all([
                Employee.countDocuments({ dept_id: dept._id }),
                Leave.countDocuments({ 
                    status: 'Approved',
                    start_date: { $lte: tomorrow },
                    end_date: { $gte: today }
                }) // Note: This is an simplification, ideally filtered by employee_id in this dept
            ]);
            
            // To be precise, we should filter onLeave by employees in this department
            const deptEmployees = await Employee.find({ dept_id: dept._id }).select('_id').lean();
            const deptEmpIds = deptEmployees.map(e => e._id);
            const actualOnLeaveRecs = await Leave.countDocuments({
                employee_id: { $in: deptEmpIds },
                status: 'Approved',
                start_date: { $lte: tomorrow },
                end_date: { $gte: today }
            });

            return {
                id: dept._id,
                name: dept.name,
                employee_count: count,
                on_leave_today: actualOnLeaveRecs
            };
        }));

        // Actual Payroll Metrics
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const [payrollStats, processedPayroll, unpaidPayroll] = await Promise.all([
            Salary.aggregate([
                { $match: { month: currentMonth, year: currentYear } },
                { $group: { 
                    _id: null, 
                    totalPayout: { $sum: "$netPay" }, 
                    totalTax: { $sum: "$monthlyTax" },
                    paidPayout: { $sum: "$paidAmount" }
                } }
            ]),
            Salary.countDocuments({ month: currentMonth, year: currentYear }),
            Salary.countDocuments({ month: currentMonth, year: currentYear, status: 'Pending' })
        ]);

        const totalPayout = payrollStats[0]?.totalPayout || 0;
        const totalTax = payrollStats[0]?.totalTax || 0;
        const paidPayout = payrollStats[0]?.paidPayout || 0;

        res.json({
            metrics: {
                total_employees: totalEmployees,
                present_today: presentCount,
                absent_today: absentCount,
                half_day_today: halfDayCount,
                pending_tasks: activeTasks,
                payroll_processed: processedPayroll,
                total_monthly_payout: totalPayout,
                paid_payout: paidPayout,
                pending_payout: Math.max(0, totalPayout - paidPayout),
                total_tax_month: totalTax,
                pending_payroll_count: unpaidPayroll,
                pending_leave_count: pendingLeaveCount
            },
            recent_pending_leaves: recentLeaves.map(l => ({
                id: l._id,
                type: l.leave_type,
                start_date: l.start_date,
                end_date: l.end_date,
                employee_name: l.employee_id ? `${l.employee_id.first_name} ${l.employee_id.last_name}` : 'Unknown'
            })),
            department_insights: deptDistribution,
            payroll_history: recentSalaries.map(s => ({
                id: s._id,
                employee_name: s.employee_id ? `${s.employee_id.first_name} ${s.employee_id.last_name}` : 'Unknown',
                department: s.employee_id?.dept_id?.name || 'N/A',
                period: `${s.month}/${s.year}`,
                net_pay: s.netPay,
                status: s.status,
                paid_at: s.paidAt || s.createdAt
            })),
            recent_activities: recentActivities.map(a => ({
                id: a._id,
                user: a.username,
                action: a.action,
                time: a.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard summary statistics for Sales
// @route   GET /api/dashboard/sales/stats
exports.getSalesStats = async (req, res) => {
    try {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const query = {};
        const personalQuery = {};
        
        // Strictly filter by salesperson if role is Sales
        if (req.user?.role?.toUpperCase() === 'SALES') {
             personalQuery.sales_person_id = req.user.id;
        }

        const [
            allLeads,
            monthlyLeads,
            allSalesOrders,
            monthlySalesOrders,
            totalCustomers,
            upcomingFollowUps
        ] = await Promise.all([
            Lead.countDocuments(),
            Lead.countDocuments({ createdAt: { $gte: monthStart } }),
            Order.find({ ...personalQuery, orderType: 'SALE', status: 'COMPLETED' }).lean(),
            Order.find({ 
                ...personalQuery, 
                orderType: 'SALE', 
                status: 'COMPLETED', 
                createdAt: { $gte: monthStart } 
            }).lean(),
            Customer.countDocuments(),
            Lead.find({ 
                next_follow_up: { $gte: today },
                status: { $ne: 'Won' } 
            })
            .populate('customer_id', 'name phone')
            .sort({ next_follow_up: 1 })
            .limit(5)
            .lean()
        ]);

        const calculateRevenue = (orders) => orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

        const allRevenue = calculateRevenue(allSalesOrders);
        const monthlyRevenue = calculateRevenue(monthlySalesOrders);

        const convertedLeadsAll = await Lead.countDocuments({ status: 'Won' });
        const convertedLeadsMonth = await Lead.countDocuments({ 
            status: 'Won', 
            updatedAt: { $gte: monthStart } 
        });

        res.json({
            all_time: {
                total_leads: allLeads,
                converted_leads: convertedLeadsAll,
                total_customers: totalCustomers,
                total_revenue: allRevenue,
                conversion_rate: allLeads > 0 ? ((convertedLeadsAll / allLeads) * 100).toFixed(1) : 0
            },
            monthly: {
                total_leads: monthlyLeads,
                converted_leads: convertedLeadsMonth,
                total_revenue: monthlyRevenue,
                conversion_rate: monthlyLeads > 0 ? ((convertedLeadsMonth / monthlyLeads) * 100).toFixed(1) : 0
            },
            upcoming_follow_ups: upcomingFollowUps.map(f => ({
                id: f._id,
                customer_name: f.customer_id?.name || 'Unknown',
                phone: f.customer_id?.phone,
                date: f.next_follow_up,
                notes: f.notes
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get detailed Sales Reporting and Trends
// @route   GET /api/dashboard/sales/reports
exports.getSalesReports = async (req, res) => {
    try {
        const today = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(today.getMonth() - 11);
        twelveMonthsAgo.setDate(1);

        // 1. Leaderboard: Performance by Representative
        const leaderboard = await Sale.aggregate([
            {
                $group: {
                    _id: "$sales_person_id",
                    totalRevenue: { $sum: "$total_amount" },
                    dealCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "rep"
                }
            },
            { $unwind: "$rep" },
            {
                $project: {
                    name: "$rep.username",
                    totalRevenue: 1,
                    dealCount: 1,
                    averageDealSize: { $divide: ["$totalRevenue", "$dealCount"] }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        // 2. Conversion Trends: 12-Month Performance
        const trends = await Lead.aggregate([
            {
                $match: {
                    status: "Converted",
                    updatedAt: { $gte: twelveMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$updatedAt" },
                        year: { $year: "$updatedAt" }
                    },
                    conversions: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // 3. Revenue Breakdown by Lead Source
        const sourceBreakdown = await Sale.aggregate([
            {
                $lookup: {
                    from: "leads",
                    localField: "customer_id",
                    foreignField: "customer_id",
                    as: "leadInfo"
                }
            },
            { $unwind: "$leadInfo" },
            {
                $group: {
                    _id: "$leadInfo.source",
                    revenue: { $sum: "$total_amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        // 4. General KPIs for reports
        const stats = await Sale.aggregate([
            {
                $group: {
                    _id: null,
                    avgDeal: { $avg: "$total_amount" },
                    maxDeal: { $max: "$total_amount" },
                    total: { $sum: "$total_amount" }
                }
            }
        ]);

        const kpIs = stats[0] || { avgDeal: 0, maxDeal: 0, total: 0 };

        // 5. Customer Retention Analytics
        const retentionStats = await Sale.aggregate([
            {
                $group: {
                    _id: "$customer_id",
                    totalSpent: { $sum: "$total_amount" },
                    orderCount: { $sum: 1 },
                    lastPurchase: { $max: "$date" }
                }
            },
            {
                $lookup: {
                    from: "customers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
            {
                $project: {
                    name: "$customer.name",
                    totalSpent: 1,
                    orderCount: 1,
                    lastPurchase: 1,
                    daysSinceLast: {
                        $divide: [
                            { $subtract: [today, "$lastPurchase"] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            }
        ]);

        const totalCust = await Customer.countDocuments();
        const repeatCust = retentionStats.filter(c => c.orderCount > 1);
        const churnRisk = retentionStats.filter(c => c.daysSinceLast > 90);

        res.json({
            leaderboard,
            trends: trends.map(t => ({
                period: `${t._id.month}/${t._id.year}`,
                conversions: t.conversions
            })),
            source_breakdown: sourceBreakdown.map(s => ({
                source: s._id,
                revenue: s.revenue,
                deal_count: s.count
            })),
            retention: {
                rate: totalCust > 0 ? ((repeatCust.length / totalCust) * 100).toFixed(1) : 0,
                repeat_customers: repeatCust.length,
                churn_risk_count: churnRisk.length,
                average_clv: totalCust > 0 ? (kpIs.total / totalCust).toFixed(2) : 0,
                top_loyal_customers: retentionStats
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .slice(0, 5)
                    .map(c => ({
                        name: c.name,
                        value: c.totalSpent,
                        orders: c.orderCount
                    }))
            },
            summary: {
                average_deal_size: kpIs.avgDeal,
                largest_deal: kpIs.maxDeal,
                cumulative_revenue: kpIs.total
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Global Search
// @route   GET /api/dashboard/search?q=query
exports.globalSearch = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        // Simple regex text search across main models
        const regex = new RegExp(query, 'i');

        const [materials, employees, customers] = await Promise.all([
            Material.find({ name: regex }).limit(5),
            Employee.find({ $or: [{ first_name: regex }, { last_name: regex }] }).limit(5),
            // We don't have the Customer model specifically required in this file yet, but we will assume it exists or ignore depending on what's available here.
            // Let's require it locally if needed, but for now we'll just search what is imported.
            Material.find({ sku: regex }).limit(5) 
        ]);

        const results = [];

        materials.forEach(m => results.push({ type: 'Material', id: m._id, name: m.name, detail: `SKU: ${m.sku} - Stock: ${m.quantity}` }));
        employees.forEach(e => results.push({ type: 'Employee', id: e._id, name: `${e.first_name} ${e.last_name}`, detail: e.designation }));

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Detailed Payroll Reports and Trends
// @route   GET /api/dashboard/payroll/reports
exports.getPayrollReports = async (req, res) => {
    try {
        const today = new Date();
        const last12Periods = [];
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        for (let i = 0; i < 12; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            last12Periods.push({ month: d.getMonth() + 1, year: d.getFullYear() });
        }

        const stats = await Salary.aggregate([
            { $match: { 
                $or: last12Periods.map(p => ({ month: p.month, year: p.year }))
            } },
            {
                $group: {
                    _id: { month: "$month", year: "$year" },
                    totalPayout: { $sum: "$netPay" },
                    totalTax: { $sum: "$monthlyTax" },
                    avgSalary: { $avg: "$netPay" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const sortedTrends = last12Periods.reverse().map(p => {
            const monthData = stats.find(s => s._id.month === p.month && s._id.year === p.year);
            return {
                period: `${monthNames[p.month - 1].slice(0, 3)} ${p.year}`,
                payout: monthData?.totalPayout || 0,
                tax: monthData?.totalTax || 0,
                employees: monthData?.count || 0
            };
        });

        // 2. Department-wise Breakdown (Current Month)
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        const deptBreakdown = await Salary.aggregate([
            { $match: { month: currentMonth, year: currentYear } },
            {
                $lookup: {
                    from: "employees",
                    localField: "employee_id",
                    foreignField: "_id",
                    as: "emp"
                }
            },
            { $unwind: "$emp" },
            {
                $lookup: {
                    from: "departments",
                    localField: "emp.dept_id",
                    foreignField: "_id",
                    as: "dept"
                }
            },
            { $unwind: "$dept" },
            {
                $group: {
                    _id: "$dept.name",
                    totalPayout: { $sum: "$netPay" },
                    employeeCount: { $sum: 1 }
                }
            },
            { $sort: { totalPayout: -1 } }
        ]);

        // 3. Overall Summary (Current Month)
        const summary = await Salary.aggregate([
            { $match: { month: currentMonth, year: currentYear } },
            {
                $group: {
                    _id: null,
                    totalPayout: { $sum: "$netPay" },
                    totalTax: { $sum: "$monthlyTax" },
                    avgNetPay: { $avg: "$netPay" },
                    maxNetPay: { $max: "$netPay" }
                }
            }
        ]);

        res.json({
            trends: sortedTrends,
            department_distribution: deptBreakdown.map(d => ({
                name: d._id,
                value: d.totalPayout,
                count: d.employeeCount
            })),
            summary: summary[0] || { totalPayout: 0, totalTax: 0, avgNetPay: 0, maxNetPay: 0 }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard summary statistics for Employee
// @route   GET /api/dashboard/employee/stats
exports.getEmployeeStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        const employeeProfile = await Employee.findOne({ user_id: req.user.id })
            .populate('dept_id', 'name')
            .lean();
        
        if (!employeeProfile) {
            return res.json({
                status: 'Not Clocked In',
                leaves_taken: 0,
                pending_leaves: 0,
                assigned_tasks: 0
            });
        }

        // Seven days ago logic for trend chart
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const [
            attendanceHistory, 
            attendanceToday,
            allLeaves, 
            latestSalary,
            recentNotifications, 
            allTasks,
            lastApprovedLeave
        ] = await Promise.all([
            Attendance.find({ 
                employee_id: employeeProfile._id,
                date: { $gte: sevenDaysAgo }
            }).select('date clock_in clock_out status').sort({ date: 1 }).lean(),
            
            Attendance.findOne({
                employee_id: employeeProfile._id,
                date: { $gte: today, $lt: tomorrow }
            }).lean(),

            Leave.find({ employee_id: employeeProfile._id }).select('status start_date end_date leave_type').sort({ createdAt: -1 }).lean(),
            
            Salary.findOne({ 
                employee_id: employeeProfile._id,
                month: currentMonth,
                year: currentYear
            }).select('status netPay month year').lean(),

            Notification.find().select('title message type created_at').sort({ created_at: -1 }).limit(5).lean(),

            Task.find({ assigned_to: employeeProfile._id }).sort({ due_date: 1 }).lean(),

            Leave.findOne({ employee_id: employeeProfile._id, status: 'Approved' })
                .select('leave_type start_date end_date')
                .sort({ start_date: -1 })
                .lean()
        ]);

        let leavesTaken = 0;
        let pendingLeaves = 0;
        const recentLeavesArr = allLeaves.slice(0, 3);

        allLeaves.forEach((leave) => {
            if (leave.status === 'Approved') leavesTaken++;
            if (leave.status === 'Pending') pendingLeaves++;
        });

        // Task Analytics & Urgency
        const taskMetrics = {
            total: allTasks.length,
            completed: allTasks.filter(t => t.status === 'Completed').length,
            pending: allTasks.filter(t => t.status !== 'Completed').length,
            overdue: 0,
            due_soon: 0
        };

        const now = new Date();
        const next24h = new Date(now);
        next24h.setHours(now.getHours() + 24);

        const prioritizedTasks = allTasks
            .filter(t => t.status !== 'Completed')
            .map(t => {
                const dueDate = new Date(t.due_date);
                let urgency = 'Normal';
                if (dueDate < now) {
                    urgency = 'Overdue';
                    taskMetrics.overdue++;
                } else if (dueDate <= next24h) {
                    urgency = 'Due Soon';
                    taskMetrics.due_soon++;
                }
                return { ...t, urgency };
            })
            .sort((a, b) => {
                const order = { 'Overdue': 0, 'Due Soon': 1, 'Normal': 2 };
                return order[a.urgency] - order[b.urgency];
            });

        return res.json({
            profile: {
                first_name: employeeProfile.first_name,
                last_name: employeeProfile.last_name,
                designation: employeeProfile.designation,
                department: employeeProfile.dept_id?.name || 'General'
            },
            today: {
                status: attendanceToday ? attendanceToday.status : 'Not Clocked In',
                clock_in: attendanceToday?.clock_in || null,
                clock_out: attendanceToday?.clock_out || null
            },
            attendance_summary: attendanceHistory,
            leaves: {
                total_taken: leavesTaken,
                pending: pendingLeaves,
                recent: recentLeavesArr,
                balances: employeeProfile.leaveBalances || { sick: 0, casual: 0, privilege: 0 },
                last_approved: lastApprovedLeave
            },
            tasks: {
                metrics: taskMetrics,
                priority_tasks: prioritizedTasks.slice(0, 5),
                all_uncompleted: prioritizedTasks
            },
            salary: latestSalary ? {
                status: latestSalary.status,
                net_pay: latestSalary.netPay,
                month: latestSalary.month,
                year: latestSalary.year
            } : {
                status: 'Not Generated',
                net_pay: 0,
                month: currentMonth,
                year: currentYear
            },
            notifications: recentNotifications
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get detailed Inventory & Financial Analytics
// @route   GET /api/dashboard/analytics
exports.getInventoryAnalytics = async (req, res) => {
    try {
        const today = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(today.getMonth() - 11);
        twelveMonthsAgo.setDate(1);

        const [
            ordersFinance,
            inventoryValue,
            stockStats,
            monthlyTrends
        ] = await Promise.all([
            // 1. Total Financials from COMPLETED orders
            Order.aggregate([
                { $match: { status: 'COMPLETED' } },
                {
                    $group: {
                        _id: "$orderType",
                        total: { $sum: "$totalAmount" }
                    }
                }
            ]),

            // 2. Current Warehouse Valuation
            Material.aggregate([
                {
                    $project: {
                        valuation: { $multiply: ["$quantity", "$price"] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalValue: { $sum: "$valuation" }
                    }
                }
            ]),

            // 3. Stock Health
            Material.aggregate([
                {
                    $group: {
                        _id: null,
                        totalItems: { $sum: 1 },
                        outOfStock: { $sum: { $cond: [{ $lte: ["$quantity", 0] }, 1, 0] } },
                        lowStock: {
                            $sum: {
                                $cond: [
                                    { $and: [{ $lt: ["$quantity", "$min_stock_level"] }, { $gt: ["$quantity", 0] }] },
                                    1, 0
                                ]
                            }
                        }
                    }
                }
            ]),

            // 4. Monthly Trend (Sales vs Purchase)
            Order.aggregate([
                {
                    $match: {
                        status: 'COMPLETED',
                        createdAt: { $gte: twelveMonthsAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: "$createdAt" },
                            year: { $year: "$createdAt" },
                            type: "$orderType"
                        },
                        amount: { $sum: "$totalAmount" }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ])
        ]);

        // Process Financials
        let purchaseValue = 0;
        let salesValue = 0;
        ordersFinance.forEach(f => {
            if (f._id === 'PURCHASE') purchaseValue = f.total;
            if (f._id === 'SALE') salesValue = f.total;
        });

        // Process Trends into a flat array for charts
        const months = [];
        for (let i = 0; i < 12; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push({ month: d.getMonth() + 1, year: d.getFullYear(), name: d.toLocaleString('default', { month: 'short' }) });
        }
        months.reverse();

        const trendData = months.map(m => {
            const p = monthlyTrends.find(t => t._id.month === m.month && t._id.year === m.year && t._id.type === 'PURCHASE');
            const s = monthlyTrends.find(t => t._id.month === m.month && t._id.year === m.year && t._id.type === 'SALE');
            return {
                name: `${m.name} ${m.year.toString().slice(-2)}`,
                purchase: p?.amount || 0,
                sales: s?.amount || 0
            };
        });

        res.json({
            financials: {
                total_purchase: purchaseValue,
                total_sales: salesValue,
                profit_loss: salesValue - purchaseValue,
                inventory_valuation: inventoryValue[0]?.totalValue || 0
            },
            stock_health: {
                total_materials: stockStats[0]?.totalItems || 0,
                low_stock: stockStats[0]?.lowStock || 0,
                out_of_stock: stockStats[0]?.outOfStock || 0
            },
            trends: trendData
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

