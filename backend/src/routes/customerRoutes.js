const express = require('express');
const router = express.Router();
const { 
    getCustomers, 
    addCustomer, 
    updateCustomer, 
    adminApproveCustomer,
    managerApproveCustomer
} = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getCustomers)
    .post(protect, authorize('Admin', 'Sales', 'Manager'), addCustomer);

router.route('/:id')
    .put(protect, authorize('Admin', 'Sales', 'Manager'), updateCustomer);

router.put('/:id/approve/admin', protect, authorize('Admin'), adminApproveCustomer);
router.put('/:id/approve/manager', protect, authorize('Manager'), managerApproveCustomer);
router.put('/:id/approve', protect, authorize('Admin'), adminApproveCustomer);

module.exports = router;
