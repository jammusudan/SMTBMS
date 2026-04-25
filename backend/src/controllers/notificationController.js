const Notification = require('../models/Notification');
const NotificationRead = require('../models/NotificationRead');

// Utility function to be called internally by other controllers
exports.generateNotification = async (title, message, type = 'Info', link = '') => {
    try {
        await Notification.create({ title, message, type, link });
    } catch (error) {
        console.error('Failed to generate notification:', error);
    }
};

// @desc    Get all announcements with personal read status
// @route   GET /api/notifications
exports.getNotifications = async (req, res) => {
    try {
        const role = req.user.role;
        const userId = req.user.id;
        const notifications = await Notification.find({
            targetRole: { $in: [role, 'All'] }
        })
            .sort({ createdAt: -1 })
            .limit(100);
            
        // Get all read records for this user to calculate isRead status
        const readRecords = await NotificationRead.find({ userId });
        const readIds = new Set(readRecords.map(r => r.notificationId.toString()));

        // Map to include personal isRead status
        const formatted = notifications.map(n => ({
            id: n._id,
            title: n.title,
            message: n.message,
            type: n.type,
            isRead: readIds.has(n._id.toString()),
            link: n.link,
            created_at: n.createdAt
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get latest 3 announcements for dashboard
// @route   GET /api/notifications/latest
exports.getLatestAnnouncements = async (req, res) => {
    try {
        const userId = req.user.id;
        const announcements = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(3);

        const readRecords = await NotificationRead.find({ 
            userId, 
            notificationId: { $in: announcements.map(a => a._id) } 
        });
        const readIds = new Set(readRecords.map(r => r.notificationId.toString()));

        const formatted = announcements.map(a => ({
            id: a._id,
            title: a.title,
            message: a.message,
            type: a.type,
            isRead: readIds.has(a._id.toString()),
            created_at: a.createdAt
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark a notification as read (using separate collection)
// @route   PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Announcement not found' });

        await NotificationRead.findOneAndUpdate(
            { userId: req.user.id, notificationId: req.params.id },
            { isRead: true, readAt: new Date() },
            { upsert: true, new: true }
        );
        
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark all unread notifications as read (for current user)
// @route   PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const unreadNotifs = await Notification.find({
            _id: { $nin: await NotificationRead.find({ userId }).distinct('notificationId') }
        });

        if (unreadNotifs.length > 0) {
            const readRecords = unreadNotifs.map(n => ({
                userId,
                notificationId: n._id,
                isRead: true,
                readAt: new Date()
            }));
            await NotificationRead.insertMany(readRecords);
        }

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Broadcast an announcement
// @route   POST /api/notifications/broadcast
exports.broadcastMessage = async (req, res) => {
    try {
        const { title, message, type = 'Info' } = req.body;
        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message are required' });
        }

        const notif = await Notification.create({ 
            title, 
            message, 
            type 
        });

        res.status(201).json({ message: 'Announcement posted', notification: notif });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an announcement
// @route   DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Announcement not found' });

        // Also delete read records
        await NotificationRead.deleteMany({ notificationId: req.params.id });
        await notification.deleteOne();
        
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
