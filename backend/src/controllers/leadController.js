const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');

// @desc    Get all leads
// @route   GET /api/leads
exports.getLeads = async (req, res) => {
    try {
        const query = {};
        if (req.user?.role?.toUpperCase() === 'SALES') {
            query.assigned_to = req.user.id;
        }

        const leads = await Lead.find(query)
            .populate('assigned_to', 'username')
            .populate('converted_customer_id', 'name email')
            .sort({ createdAt: -1 });

        const formatted = leads.map(l => ({
            id: l._id,
            name: l.name,
            email: l.email,
            phone: l.phone,
            source: l.source,
            context: l.context,
            estimatedValue: l.estimatedValue,
            priority: l.priority,
            reviewDate: l.reviewDate,
            notes: l.notes,
            status: l.status,
            next_follow_up: l.next_follow_up,
            assigned_to: l.assigned_to?.username,
            customer_id: l.customer_id,
            converted_customer_id: l.converted_customer_id?._id,
            created_at: l.createdAt
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new lead
// @route   POST /api/leads
exports.createLead = async (req, res) => {
    const { 
        name, email, phone, source, notes, next_follow_up, 
        customer_id, context, estimatedValue, priority, assigned_to, reviewDate 
    } = req.body;

    try {
        if (!context) return res.status(400).json({ message: 'Deal context is mandatory' });
        if (!estimatedValue || isNaN(estimatedValue)) return res.status(400).json({ message: 'Valid estimated value is required' });

        let leadData = { 
            source, notes, next_follow_up, 
            context, estimatedValue, priority, 
            assigned_to: assigned_to || req.user.id,
            reviewDate: reviewDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        };

        if (customer_id) {
            const customer = await Customer.findById(customer_id);
            if (!customer) return res.status(404).json({ message: 'Linked customer not found' });
            leadData.name = customer.name;
            leadData.email = customer.email;
            leadData.phone = customer.phone;
            leadData.customer_id = customer_id;
        } else {
            if (!name) return res.status(400).json({ message: 'Name is required for manual lead capture' });
            leadData.name = name;
            leadData.email = email;
            leadData.phone = phone;
        }

        const lead = await Lead.create(leadData);
        res.status(201).json(lead);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Convert lead to a deal (Opportunity)
// @route   POST /api/leads/:id/convert
exports.convertToDeal = async (req, res) => {
    const { expected_close_date, notes } = req.body;
    try {
        const lead = await Lead.findById(req.params.id).lean();
        if (!lead) return res.status(404).json({ message: 'Lead not found' });
        
        if (lead.status !== 'Qualified') {
            return res.status(400).json({ message: 'Only Qualified leads can be converted to deals' });
        }

        // Create new deal
        let deal;
        try {
            const dealData = {
                lead_id: new mongoose.Types.ObjectId(lead._id),
                prospect_name: String(lead.name),
                prospect_email: String(lead.email || ''),
                prospect_phone: String(lead.phone || ''),
                title: `Opportunity: ${lead.name}`,
                amount: Number(lead.estimatedValue) || 0,
                expected_close_date: expected_close_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                notes: notes || lead.notes,
                assigned_to: new mongoose.Types.ObjectId(lead.assigned_to?._id || lead.assigned_to || req.user.id),
                stage: 'Prospecting'
            };
            deal = await Deal.create(dealData);
        } catch (dealError) {
            console.error('DEAL_CREATION_INNER_ERROR:', dealError);
            return res.status(500).json({ message: `Deal Creation Failed: ${dealError.message}` });
        }

        res.status(201).json({ 
            message: 'Lead converted to Deal successfully', 
            deal_id: deal._id,
            title: deal.title
        });
    } catch (error) {
        console.error('CONVERT_LEAD_TO_DEAL_OUTER_ERROR:', error);
        res.status(500).json({ message: error.message || 'Server error during conversion' });
    }
};

// @desc    Update lead status
// @route   PUT /api/leads/:id/status
exports.updateLeadStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        if (!lead) return res.status(404).json({ message: 'Lead not found' });
        res.json({ message: `Lead status updated to ${status}`, lead });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update lead follow-up date
// @route   PUT /api/leads/:id/follow-up
exports.updateFollowUp = async (req, res) => {
    const { next_follow_up } = req.body;
    try {
        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            { next_follow_up },
            { new: true }
        );
        if (!lead) return res.status(404).json({ message: 'Lead not found' });
        res.json({ message: 'Follow-up date updated', lead });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
