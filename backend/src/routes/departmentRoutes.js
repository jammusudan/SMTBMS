const express = require('express');
const router = express.Router();
const { getDepartments, addDepartment, deleteDepartment } = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getDepartments)
    .post(protect, authorize('Admin', 'HR'), addDepartment);

router.route('/:id')
    .delete(protect, authorize('Admin', 'HR'), deleteDepartment);

module.exports = router;
