const express = require('express');
const router = express.Router();
const { getLeads, createLead, updateLeadStatus, updateFollowUp, convertToDeal } = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getLeads)
    .post(protect, authorize('Admin', 'Manager', 'Sales'), createLead);

router.route('/:id/status')
    .put(protect, authorize('Admin', 'Manager', 'Sales'), updateLeadStatus);

router.route('/:id/follow-up')
    .put(protect, authorize('Admin', 'Manager', 'Sales'), updateFollowUp);

router.route('/:id/convert')
    .post(protect, authorize('Admin', 'Manager', 'Sales'), convertToDeal);

module.exports = router;
