const express = require('express');
const router = express.Router();
const { getEmployees, getProfile, upsertEmployee, deleteEmployee } = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('Admin', 'HR', 'Manager'), getEmployees)
    .post(protect, authorize('Admin', 'HR'), upsertEmployee);

router.get('/profile', protect, getProfile);

router.route('/:id')
    .delete(protect, authorize('Admin', 'HR'), deleteEmployee);

router.put('/:id/salary', protect, authorize('HR'), require('../controllers/employeeController').updateSalaryStructure);
router.patch('/:id/status', protect, authorize('Admin', 'HR'), require('../controllers/employeeController').updateStatus);

module.exports = router;
