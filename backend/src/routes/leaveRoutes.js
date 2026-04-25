const express = require('express');
const router = express.Router();
const { applyLeave, getLeaves, updateLeaveStatus } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getLeaves)
    .post(protect, applyLeave);

router.put('/:id/status', protect, authorize('Admin', 'HR'), updateLeaveStatus);

module.exports = router;
