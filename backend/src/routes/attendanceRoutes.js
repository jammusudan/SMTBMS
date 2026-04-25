const express = require('express');
const router = express.Router();
const { clockIn, clockOut, getAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getAttendance);
router.post('/clock-in', protect, clockIn);
router.put('/clock-out', protect, clockOut);

module.exports = router;
