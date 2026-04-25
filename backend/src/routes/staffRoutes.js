const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All staff routes protected by auth
router.use(protect);

router.get('/', staffController.getStaff);
router.patch('/:id/status', authorize('Admin', 'Super Admin', 'HR'), staffController.updateStaffStatus);

module.exports = router;
