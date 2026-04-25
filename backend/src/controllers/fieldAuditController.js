const FieldAudit = require('../models/FieldAudit');

// @desc    Get all field audits (Admins see all, Sales see their own)
// @route   GET /api/field-audits
exports.getAudits = async (req, res) => {
    try {
        const query = {};
        if (req.user.role === 'Sales') {
            query.sales_rep = req.user.id;
        }

        const audits = await FieldAudit.find(query)
            .populate('sales_rep', 'username')
            .sort({ visit_date: -1 });
            
        res.json(audits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new field audit
// @route   POST /api/field-audits
exports.createAudit = async (req, res) => {
    try {
        const audit = await FieldAudit.create({
            ...req.body,
            sales_rep: req.user.id
        });
        res.status(201).json(audit);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete an audit
// @route   DELETE /api/field-audits/:id
exports.deleteAudit = async (req, res) => {
    try {
        const audit = await FieldAudit.findById(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit not found' });
        
        // Authorization check
        if (req.user.role !== 'Admin' && audit.sales_rep.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        await audit.deleteOne();
        res.json({ message: 'Audit record removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
