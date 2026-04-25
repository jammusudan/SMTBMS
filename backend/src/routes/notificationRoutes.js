const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, broadcastMessage, deleteNotification, getLatestAnnouncements } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // Ensure all notification routes are authenticated

router.get('/', getNotifications);
router.get('/latest', getLatestAnnouncements);
router.put('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.post('/broadcast', authorize('Admin', 'HR'), broadcastMessage);
router.delete('/:id', authorize('Admin', 'HR'), deleteNotification);

module.exports = router;
