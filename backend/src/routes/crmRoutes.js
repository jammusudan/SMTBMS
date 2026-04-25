const express = require('express');
const router = express.Router();
const { getCRMAnalytics, getCRMTrends } = require('../controllers/crmController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/analytics', protect, authorize('Admin', 'Super Admin', 'Sales', 'Manager'), getCRMAnalytics);
router.get('/trends', protect, authorize('Admin', 'Super Admin', 'Sales', 'Manager'), getCRMTrends);

module.exports = router;
