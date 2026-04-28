const express = require('express');
const router = express.Router();
const { applyLeave, getLeaves, updateLeaveStatus, bulkUpdateStatus } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getLeaves)
    .post(protect, applyLeave);

router.post('/bulk', protect, authorize('Admin', 'HR', 'Manager'), bulkUpdateStatus);
router.put('/:id/status', protect, authorize('Admin', 'HR', 'Manager'), updateLeaveStatus);

module.exports = router;
