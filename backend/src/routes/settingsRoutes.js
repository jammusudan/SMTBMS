const express = require('express');
const router = express.Router();
const { getUsersWithRoles, updateUserRole } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
// Only Admins can change roles
router.use(authorize(['Admin']));

router.get('/users', getUsersWithRoles);
router.put('/users/role', updateUserRole);

module.exports = router;
