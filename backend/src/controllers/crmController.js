const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Order = require('../models/Order');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get CRM High-Level Analytics
// @route   GET /api/crm/analytics
exports.getCRMAnalytics = async (req, res) => {
    try {
        const query = {};
        const orderQuery = { orderType: 'SALE' };
        if (req.user?.role?.toUpperCase() === 'SALES') {
            query.assigned_to = new mongoose.Types.ObjectId(req.user.id);
            orderQuery.createdByUserId = new mongoose.Types.ObjectId(req.user.id);
        }

        // 1. Metrics from Deals (PIPELINE ONLY)
        const deals = await Deal.find(query);
        const totalDeals = deals.length;
        const activeDeals = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost');
        const pipelineValue = activeDeals.reduce((sum, d) => sum + d.amount, 0);

        // 2. Metrics from Orders (REVENUE ONLY)
        const finishedSales = await Order.find({ ...orderQuery, status: 'COMPLETED' });
        const totalRevenue = finishedSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

        // 3. Conversion Rate (Leads status 'Won' / Total Leads)
        const leadQuery = {};
        if (req.user?.role?.toUpperCase() === 'SALES') leadQuery.assigned_to = req.user.id;
        const totalLeads = await Lead.countDocuments(leadQuery);
        const wonLeads = await Lead.countDocuments({ ...leadQuery, status: 'Won' });
        const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

        // Stage Distribution for Chart
        const dealStats = await Deal.aggregate([
            { $match: query },
            { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$amount' } } }
        ]);

        // Leaderboard (By actual COMPLETED SALE Orders)
        const salesLeaderboard = await Order.aggregate([
            { $match: { orderType: 'SALE', status: 'COMPLETED' } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdByUserId',
                    foreignField: '_id',
                    as: 'salesrep'
                }
            },
            { $unwind: '$salesrep' },
            {
                $group: {
                    _id: '$salesrep._id',
                    name: { $first: '$salesrep.username' },
                    totalSales: { $sum: '$totalAmount' },
                    dealCount: { $sum: 1 }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            kpis: {
                totalRevenue,
                activeDeals: activeDeals.length,
                pipelineValue,
                conversionRate: conversionRate.toFixed(1),
                avgDealValue: totalDeals > 0 ? (deals.reduce((sum, d) => sum + d.amount, 0) / totalDeals).toFixed(0) : 0,
                topPerformer: salesLeaderboard[0]?.name || 'N/A'
            },
            leaderboard: salesLeaderboard,
            stageDistribution: dealStats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Revenue and Conversion Trends
// @route   GET /api/crm/trends
exports.getCRMTrends = async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Use Orders (SALE) for revenue trends
        const revenueTrend = await Order.aggregate([
            { 
                $match: { 
                    orderType: 'SALE', 
                    status: 'COMPLETED', 
                    createdAt: { $gte: sixMonthsAgo } 
                } 
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    monthNum: { $first: { $month: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { monthNum: 1 } }
        ]);

        const leadSourceStats = await Lead.aggregate([
            {
                $group: {
                    _id: '$source',
                    count: { $sum: 1 },
                    wonCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] }
                    }
                }
            }
        ]);

        res.json({
            revenueTrend,
            leadSources: leadSourceStats.map(s => ({
                source: s._id || 'Unknown',
                count: s.count,
                conversion: s.count > 0 ? ((s.wonCount / s.count) * 100).toFixed(1) : 0
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
