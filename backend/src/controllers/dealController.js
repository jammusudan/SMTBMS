const Deal = require('../models/Deal');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Lead = require('../models/Lead');

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
    const { stage, lost_reason } = req.body;
    try {
        const deal = await Deal.findById(req.params.id);
        if (!deal) return res.status(404).json({ message: 'Deal not found' });

        if (stage === 'Won' && deal.stage !== 'Won') {
            // Mandatory Validation: amount, materialId, quantity
            if (!deal.amount || !deal.materialId || !deal.quantity) {
                return res.status(400).json({ 
                    message: 'Deal value, material, and quantity are mandatory before finalizing sale' 
                });
            }

            // 1. Create/Find Customer
            let customer;
            if (deal.customer_id) {
                customer = await Customer.findById(deal.customer_id);
            } else {
                // Create from lead/prospect info
                customer = await Customer.create({
                    name: deal.prospect_name || 'Converted Lead',
                    email: deal.prospect_email,
                    phone: deal.prospect_phone,
                    isApproved: true // Finalized sale implies approval
                });
                deal.customer_id = customer._id;
            }

            // 2. Create Sales Order
            const order = await Order.create({
                customerId: customer._id,
                items: [{
                    materialId: deal.materialId,
                    quantity: deal.quantity,
                    price: deal.amount / (deal.quantity || 1)
                }],
                totalAmount: deal.amount,
                status: 'PENDING',
                orderType: 'SALE',
                createdByUserId: req.user.id
            });

            // 3. Link Lead if exists
            if (deal.lead_id) {
                await Lead.findByIdAndUpdate(deal.lead_id, {
                    converted_customer_id: customer._id
                });
            }
        }

        deal.stage = stage;
        if (stage === 'Lost') deal.lost_reason = lost_reason;
        
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
