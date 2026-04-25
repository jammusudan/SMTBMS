const Transaction = require('../models/Transaction');

// @desc    Get all transactions
// @route   GET /api/transactions
exports.getTransactions = async (req, res) => {
    try {
        const query = {};
        // Transactions are usually viewed by Admin/Finance, 
        // but if we want to filter by Sales rep who owned the deal:
        // We'd need to populate deals.
        
        const transactions = await Transaction.find(query)
            .populate({
                path: 'deal_id',
                populate: { path: 'assigned_to', select: 'username' }
            })
            .populate('customer_id', 'name email')
            .sort({ transaction_date: -1 });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
exports.getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('deal_id')
            .populate('customer_id');
            
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create transaction (Manual)
// @route   POST /api/transactions
exports.createTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.create(req.body);
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
