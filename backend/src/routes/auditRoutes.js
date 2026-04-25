const express = require('express');
const router = express.Router();
const { getAuditBaseline, submitAudit, getAuditHistory } = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getAuditHistory)
    .post(protect, authorize('Admin', 'Sales', 'Employee', 'HR', 'Manager'), submitAudit);

router.get('/baseline', protect, getAuditBaseline);

module.exports = router;
