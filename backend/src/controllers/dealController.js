const Deal = require('../models/Deal');

// @desc    Get all deals
// @route   GET /api/deals
exports.getDeals = async (req, res) => {
    try {
        const query = {};
        if (req.user?.role?.toUpperCase() === 'SALES') {
            query.assigned_to = req.user.id;
        }

        const deals = await Deal.find(query)
            .populate('customer_id', 'name email')
            .populate('assigned_to', 'username')
            .sort({ createdAt: -1 });

        res.json(deals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new deal
// @route   POST /api/deals
exports.createDeal = async (req, res) => {
    const { customer_id, title, amount, stage, expected_close_date, notes } = req.body;
    try {
        const deal = await Deal.create({
            customer_id,
            title,
            amount,
            stage,
            expected_close_date,
            notes,
            assigned_to: req.user.id
        });
        res.status(201).json(deal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update deal stage
// @route   PUT /api/deals/:id/stage
exports.updateDealStage = async (req, res) => {
    const { stage } = req.body;
    try {
        const deal = await Deal.findById(req.params.id);
        if (!deal) return res.status(404).json({ message: 'Deal not found' });

        deal.stage = stage;
        await deal.save();

        res.json({ message: `Deal stage updated to ${stage}`, deal });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete deal
// @route   DELETE /api/deals/:id
exports.deleteDeal = async (req, res) => {
    try {
        const deal = await Deal.findByIdAndDelete(req.params.id);
        if (!deal) return res.status(404).json({ message: 'Deal not found' });
        res.json({ message: 'Deal deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
