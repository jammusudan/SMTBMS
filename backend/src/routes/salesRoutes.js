const express = require('express');
const router = express.Router();
const { getSales, recordSale } = require('../controllers/salesController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getSales)
    .post(protect, authorize('Admin', 'Sales'), recordSale);

module.exports = router;
