const Sale = require('../models/Sale');

// @desc    Get all sales
// @route   GET /api/sales
exports.getSales = async (req, res) => {
    try {
        const sales = await Sale.find()
            .populate('customer_id', 'name')
            .populate('sales_person_id', 'username')
            .sort({ date: -1 });

        const formatted = sales.map(s => ({
            id: s._id,
            customer_name: s.customer_id?.name,
            salesperson_name: s.sales_person_id?.username,
            date: s.date,
            total_amount: s.total_amount
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Record a new sale
// @route   POST /api/sales
exports.recordSale = async (req, res) => {
    const { customer_id, date, total_amount } = req.body;

    if (!customer_id || total_amount <= 0) {
        return res.status(400).json({ message: 'Valid customer and positive amount required' });
    }

    try {
        const sale = await Sale.create({
            customer_id,
            sales_person_id: req.user.id,
            date,
            total_amount
        });
        
        res.status(201).json({ id: sale._id, message: 'Sale recorded successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
