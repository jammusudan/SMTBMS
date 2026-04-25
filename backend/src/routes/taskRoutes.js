const express = require('express');
const router = express.Router();
const { 
    getTasks, 
    createTask, 
    updateTaskStatus, 
    deleteTask,
    approveTask 
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getTasks)
    .post(protect, authorize('Admin', 'HR', 'Manager'), createTask);

router.route('/:id/approve')
    .put(protect, authorize('Admin', 'Manager'), approveTask);

router.route('/:id/status')
    .put(protect, updateTaskStatus); // employees can update their task status

router.route('/:id')
    .delete(protect, authorize('Admin', 'HR', 'Manager'), deleteTask);

module.exports = router;
