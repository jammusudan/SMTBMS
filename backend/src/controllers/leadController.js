const Lead = require('../models/Lead');
const Customer = require('../models/Customer');

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

// @desc    Convert lead to customer
// @route   POST /api/leads/:id/convert
exports.convertLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });
        
        if (lead.converted_customer_id) {
            return res.status(400).json({ message: 'Lead already converted to customer' });
        }

        // Create new customer
        const customer = await Customer.create({
            name: lead.name,
            email: lead.email,
            phone: lead.phone
        });

        // Update lead
        lead.status = 'Converted';
        lead.converted_customer_id = customer._id;
        await lead.save();

        res.json({ 
            message: 'Lead converted successfully', 
            customer_id: customer._id,
            customer_name: customer.name
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
