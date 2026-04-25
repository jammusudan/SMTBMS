const express = require('express');
const router = express.Router();
const {
    getMaterials,
    getMaterialById,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    updateStock,
    getStockLogs
} = require('../controllers/materialController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getMaterials)
    .post(protect, authorize('Admin'), addMaterial);

router.route('/:id/stock')
    .put(protect, authorize('Admin', 'Manager'), updateStock);

router.route('/:id/logs')
    .get(protect, authorize('Admin'), getStockLogs);

router.route('/:id')
    .get(protect, getMaterialById)
    .put(protect, authorize('Admin', 'Manager'), updateMaterial)
    .delete(protect, authorize('Admin'), deleteMaterial);

module.exports = router;
