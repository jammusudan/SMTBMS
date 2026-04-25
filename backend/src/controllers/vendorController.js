const Vendor = require('../models/Vendor');

// @desc    Get all vendors
// @route   GET /api/vendors
exports.getVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find().sort({ name: 1 });
        const formatted = vendors.map(v => ({
            ...v._doc,
            id: v._id,
            _id: v._id
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add new vendor
// @route   POST /api/vendors
exports.addVendor = async (req, res) => {
    const { name, contact_person, email, phone, address } = req.body;
    try {
        const vendor = await Vendor.create({ name, contact_person, email, phone, address });
        res.status(201).json({ ...vendor._doc, id: vendor._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
exports.updateVendor = async (req, res) => {
    const { name, contact_person, email, phone, address } = req.body;
    try {
        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            { name, contact_person, email, phone, address },
            { new: true, runValidators: true }
        );
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
        res.json({ 
            message: 'Vendor updated successfully', 
            vendor: { ...vendor._doc, id: vendor._id } 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
exports.deleteVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findByIdAndDelete(req.params.id);
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
        res.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
