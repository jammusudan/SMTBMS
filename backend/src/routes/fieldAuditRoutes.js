const express = require('express');
const router = express.Router();
const { getAudits, createAudit, deleteAudit } = require('../controllers/fieldAuditController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getAudits)
    .post(protect, authorize('Admin', 'Sales'), createAudit);

router.route('/:id')
    .delete(protect, authorize('Admin', 'Sales'), deleteAudit);

module.exports = router;
