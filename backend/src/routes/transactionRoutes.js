const express = require('express');
const router = express.Router();
const { getTransactions, getTransactionById, createTransaction } = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('Admin', 'Sales'), getTransactions)
    .post(protect, authorize('Admin'), createTransaction);

router.route('/:id')
    .get(protect, authorize('Admin', 'Sales'), getTransactionById);

module.exports = router;
