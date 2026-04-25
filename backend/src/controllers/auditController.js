const AuditReport = require('../models/AuditReport');
const Material = require('../models/Material');
const Order = require('../models/Order');
const Task = require('../models/Task');
const Deal = require('../models/Deal');
const Transaction = require('../models/Transaction');

// @desc    Get baseline data for current audit
// @route   GET /api/audits/baseline
exports.getAuditBaseline = async (req, res) => {
    try {
        const materials = await Material.find({}, 'name quantity unit sku');
        
        // Fetch orders with parent Deal and status info
        const orders = await Order.find({ status: { $ne: 'CANCELLED' } })
            .populate('customerId', 'name')
            .populate({
                path: 'materialId',
                select: 'name'
            })
            .sort({ createdAt: -1 })
            .limit(30);

        // Fetch Deals linked to these orders to get original Deal Value
        // Note: Cross-referencing by customer and material as orders are fulfillment instances
        const deals = await Deal.find({ stage: 'Won' }).limit(50);

        // Fetch payments/transactions to verify status
        const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(100);

        const tasks = await Task.find({ status: { $in: ['Completed', 'Approved'] } })
            .populate('assignedTo', 'username first_name last_name')
            .populate('customerId', 'name')
            .limit(30);

        res.json({ 
            materials, 
            orders, 
            deals: deals.map(d => ({
                ...d.toObject(),
                customerId: d.customer_id // Normalize for frontend consistency
            })), 
            transactions: transactions.map(t => ({
                ...t.toObject(),
                customerId: t.customer_id, // Normalize for frontend consistency
                dealId: t.deal_id
            })), 
            tasks 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit a new audit report
// @route   POST /api/audits
exports.submitAudit = async (req, res) => {
    try {
        const { inventory_items, sales_items, activity_items, summary: userSummary } = req.body;
        
        // Calculate total discrepancies
        const inventoryDiscrepancies = inventory_items.filter(i => i.discrepancy !== 0).length;
        const salesDiscrepancies = sales_items.filter(s => s.mismatch_flag).length;
        
        const totalDiscrepancies = inventoryDiscrepancies + salesDiscrepancies;

        // Auto-generate summary if user didn't provide a specific one or prepend to it
        let autoSummary = "";
        if (totalDiscrepancies === 0) {
            autoSummary = "System integrity verified. No physical or sales discrepancies detected.";
        } else {
            autoSummary = `${totalDiscrepancies} discrepancies detected (Inventory: ${inventoryDiscrepancies}, Sales: ${salesDiscrepancies}). Executive review recommended.`;
        }

        const finalSummary = userSummary ? `${userSummary} | ${autoSummary}` : autoSummary;
        const status = totalDiscrepancies === 0 ? 'Verified' : 'Review Required';

        const report = await AuditReport.create({
            auditor: req.user.id,
            inventory_items,
            sales_items,
            activity_items,
            summary: finalSummary,
            total_discrepancies: totalDiscrepancies,
            status
        });

        res.status(201).json(report);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get audit history
// @route   GET /api/audits
exports.getAuditHistory = async (req, res) => {
    try {
        const query = {};
        if (['Employee', 'Sales'].includes(req.user.role)) {
            query.auditor = req.user.id;
        }
        const reports = await AuditReport.find(query)
            .populate('auditor', 'username')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
