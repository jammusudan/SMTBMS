const express = require('express');
const router = express.Router();
const { getLogs, createLog } = require('../controllers/logController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', authorize('Admin', 'Manager'), getLogs);
router.post('/', authorize('Admin', 'Manager'), createLog);

module.exports = router;
