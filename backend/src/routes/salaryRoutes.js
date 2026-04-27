const express = require('express');
const router = express.Router();
const { 
    getSalaries, 
    batchGenerate, 
    getJobStatus,
    addAdjustment,
    processPayment,
    adminReOpen,
    rollbackBatch,
    emergencyRollback,
    getSalaryById,
    logDownload
} = require('../controllers/salaryController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Base Filtering & Batch Trigger
router.route('/')
    .get(protect, getSalaries);

router.post('/batch', protect, authorize('HR'), batchGenerate);

// Async Monitoring
router.get('/jobs/:id', protect, authorize('HR'), getJobStatus);

// Record Level Operations
router.patch('/:id/adjustments', protect, authorize('HR'), addAdjustment);
router.put('/:id/payment', protect, authorize('HR'), processPayment);
router.post('/:id/re-open', protect, authorize('Admin'), adminReOpen);

// Batch Recovery
router.post('/rollback', protect, authorize('HR'), emergencyRollback);
router.post('/rollback/:batchId', protect, authorize('HR'), rollbackBatch);

// Individual View
router.get('/:id', protect, getSalaryById);
router.post('/:id/log-download', protect, logDownload);

module.exports = router;
