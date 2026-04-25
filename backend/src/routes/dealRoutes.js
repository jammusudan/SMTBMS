const express = require('express');
const router = express.Router();
const { getDeals, createDeal, updateDealStage, deleteDeal } = require('../controllers/dealController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getDeals)
    .post(protect, authorize('Admin', 'Sales'), createDeal);

router.route('/:id/stage')
    .put(protect, authorize('Admin', 'Sales'), updateDealStage);

router.route('/:id')
    .delete(protect, authorize('Admin'), deleteDeal);

module.exports = router;
