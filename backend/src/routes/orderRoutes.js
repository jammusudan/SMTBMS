const express = require('express');
const router = express.Router();
const { getOrders, getOrderById, createOrder, updateOrderStatus, updatePaymentStatus } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getOrders)
    .post(protect, authorize('Admin', 'Sales', 'Manager'), createOrder);

router.route('/:id')
    .get(protect, getOrderById);

router.route('/:id/status')
    .put(protect, authorize('Admin', 'Manager', 'Sales'), updateOrderStatus);

router.route('/:id/payment')
    .put(protect, authorize('Admin'), updatePaymentStatus);

module.exports = router;
