const express = require('express');
const router = express.Router();
const { getStats, globalSearch, getEmployeeStats, getHRStats, getSalesStats, getSalesReports, getPayrollReports, getInventoryAnalytics } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, getStats);
router.get('/analytics', protect, authorize('Admin', 'Manager'), getInventoryAnalytics);
router.get('/hr/stats', protect, authorize('Admin', 'HR'), getHRStats);
router.get('/payroll/reports', protect, authorize('Admin', 'HR', 'Manager'), getPayrollReports);
router.get('/sales/stats', protect, authorize('Admin', 'Sales'), getSalesStats);
router.get('/sales/reports', protect, authorize('Admin', 'Sales'), getSalesReports);
router.get('/employee/stats', protect, getEmployeeStats);
router.get('/search', protect, globalSearch);

module.exports = router;
