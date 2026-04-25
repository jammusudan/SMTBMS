const Customer = require('../models/Customer');
const Notification = require('../models/Notification');

// @desc    Get all customers
// @route   GET /api/customers
exports.getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().sort({ name: 1 });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add new customer
// @route   POST /api/customers
exports.addCustomer = async (req, res) => {
    const { name, email, phone, address } = req.body;
    try {
        const customer = await Customer.create({ name, email, phone, address });
        res.status(201).json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
exports.updateCustomer = async (req, res) => {
    const { name, email, phone, address } = req.body;
    try {
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { name, email, phone, address },
            { new: true, runValidators: true }
        );
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json({ message: 'Customer updated successfully', customer });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Approve customer (Admin stage)
// @route   PUT /api/customers/:id/approve/admin
exports.adminApproveCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { 
                adminApproved: true, 
                adminApprovedAt: new Date(),
                adminApprovedBy: req.user.id
            },
            { new: true }
        );
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        // Notify Managers
        await Notification.create({
            title: 'Customer Verification Required',
            message: `Admin has approved "${customer.name}". Manager seal required for activation.`,
            type: 'Urgent',
            targetRole: 'Manager',
            link: '/customers'
        });

        res.json({ message: 'Admin approval recorded. Pending Manager verification.', customer });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve customer (Manager Final stage)
// @route   PUT /api/customers/:id/approve/manager
exports.managerApproveCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        if (!customer.adminApproved) {
            return res.status(400).json({ message: 'Customer must be approved by Admin first' });
        }

        customer.managerApproved = true;
        customer.managerApprovedAt = new Date();
        customer.managerApprovedBy = req.user.id;
        customer.isApproved = true; // Final activation
        
        await customer.save();
        res.json({ message: 'Manager approval granted. Customer is now active.', customer });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Keep old route for backward compatibility but map it to Admin
exports.approveCustomer = exports.adminApproveCustomer;
