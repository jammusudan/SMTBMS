const express = require('express');
const router = express.Router();
const { getDeals, createDeal, updateDealStage, deleteDeal } = require('../controllers/dealController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getDeals)
    .post(protect, authorize('Admin', 'Manager', 'Sales'), createDeal);

router.route('/:id/stage')
    .put(protect, authorize('Admin', 'Manager', 'Sales'), updateDealStage);

router.route('/:id')
    .delete(protect, authorize('Admin', 'Manager'), deleteDeal);

module.exports = router;
