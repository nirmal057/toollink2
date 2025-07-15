import express from 'express';
import { authorize, authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Mock notification data - Updated to match frontend expectations
const mockNotifications = [
    {
        _id: '1',
        userId: null, // System notification
        type: 'info',
        category: 'system',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight at 2 AM',
        priority: 'normal',
        status: 'sent',
        isRead: false,
        createdAt: new Date().toISOString(),
        recipient: { specific: false },
        sender: { system: true, name: 'System' },
        isArchived: false
    },
    {
        _id: '2',
        userId: null,
        type: 'warning',
        category: 'inventory',
        title: 'Low Stock Alert',
        message: 'Tool A is running low on stock (5 remaining)',
        priority: 'high',
        status: 'sent',
        isRead: false,
        createdAt: new Date().toISOString(),
        recipient: { specific: false },
        sender: { system: true, name: 'Inventory System' },
        isArchived: false
    },
    {
        _id: '3',
        userId: null,
        type: 'info',
        category: 'order',
        title: 'New Order Received',
        message: 'Order ORD-001 has been placed and needs approval',
        priority: 'normal',
        status: 'sent',
        isRead: false,
        createdAt: new Date().toISOString(),
        recipient: { specific: false },
        sender: { system: true, name: 'Order System' },
        isArchived: false
    }
];

// Get all notifications for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { category, priority, unreadOnly, page = 1, limit = 20 } = req.query;

        let filteredNotifications = mockNotifications.filter(n =>
            n.userId === null || n.userId === req.user._id.toString()
        );

        if (category) {
            filteredNotifications = filteredNotifications.filter(n => n.category === category);
        }

        if (priority) {
            filteredNotifications = filteredNotifications.filter(n => n.priority === priority);
        }

        if (unreadOnly === 'true') {
            filteredNotifications = filteredNotifications.filter(n => !n.isRead);
        }

        // Sort by creation date (newest first)
        filteredNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Count unread notifications
        const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginatedNotifications = filteredNotifications.slice(skip, skip + parseInt(limit));
        const totalPages = Math.ceil(filteredNotifications.length / parseInt(limit));

        res.json({
            success: true,
            notifications: paginatedNotifications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: totalPages,
                totalCount: filteredNotifications.length,
                hasNext: parseInt(page) < totalPages,
                hasPrev: parseInt(page) > 1
            },
            unreadCount: unreadCount
        });
    } catch (error) {
        logger.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notifications',
            errorType: 'FETCH_NOTIFICATIONS_ERROR'
        });
    }
});

// Get notification statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userNotifications = mockNotifications.filter(n =>
            n.userId === null || n.userId === req.user._id.toString()
        );

        const stats = {
            total: userNotifications.length,
            unread: userNotifications.filter(n => !n.isRead).length,
            read: userNotifications.filter(n => n.isRead).length,
            byCategory: {
                system: userNotifications.filter(n => n.category === 'system').length,
                inventory: userNotifications.filter(n => n.category === 'inventory').length,
                order: userNotifications.filter(n => n.category === 'order').length,
                delivery: userNotifications.filter(n => n.category === 'delivery').length
            },
            byPriority: {
                high: userNotifications.filter(n => n.priority === 'high').length,
                normal: userNotifications.filter(n => n.priority === 'normal').length,
                low: userNotifications.filter(n => n.priority === 'low').length
            }
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Get notification statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notification statistics',
            errorType: 'FETCH_STATS_ERROR'
        });
    }
});

// Get unread notifications count
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const userNotifications = mockNotifications.filter(n =>
            n.userId === null || n.userId === req.user._id.toString()
        );

        const unreadCount = userNotifications.filter(n => !n.isRead).length;

        logger.info(`Unread notifications count: ${unreadCount} for user ${req.user._id}`);

        res.json({
            success: true,
            data: {
                count: unreadCount
            }
        });
    } catch (error) {
        logger.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch unread count',
            errorType: 'FETCH_UNREAD_COUNT_ERROR'
        });
    }
});

// Get single notification
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const notification = mockNotifications.find(n => n._id === req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found',
                errorType: 'NOTIFICATION_NOT_FOUND'
            });
        }

        // Check if user can access this notification
        if (notification.userId && notification.userId !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                errorType: 'ACCESS_DENIED'
            });
        }

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        logger.error('Get notification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notification',
            errorType: 'FETCH_NOTIFICATION_ERROR'
        });
    }
});

// Create notification (admin only)
router.post('/', authorize('admin', 'warehouse', 'cashier'), async (req, res) => {
    try {
        const { userId, type, title, message, priority = 'medium' } = req.body;

        const newNotification = {
            id: String(mockNotifications.length + 1),
            userId,
            type,
            title,
            message,
            priority,
            read: false,
            createdAt: new Date().toISOString(),
            createdBy: req.user._id
        };

        mockNotifications.push(newNotification);

        logger.info(`Notification created: ${newNotification.id} by ${req.user.fullName}`);

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: newNotification
        });
    } catch (error) {
        logger.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create notification',
            errorType: 'CREATE_NOTIFICATION_ERROR'
        });
    }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const notificationIndex = mockNotifications.findIndex(n => n._id === req.params.id);

        if (notificationIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found',
                errorType: 'NOTIFICATION_NOT_FOUND'
            });
        }

        const notification = mockNotifications[notificationIndex];

        // Check if user can access this notification
        if (notification.userId && notification.userId !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                errorType: 'ACCESS_DENIED'
            });
        }

        mockNotifications[notificationIndex].isRead = true;
        mockNotifications[notificationIndex].readAt = new Date().toISOString();
        mockNotifications[notificationIndex].status = 'read';

        res.json({
            success: true,
            message: 'Notification marked as read',
            data: mockNotifications[notificationIndex]
        });
    } catch (error) {
        logger.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notification as read',
            errorType: 'MARK_READ_ERROR'
        });
    }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
    try {
        const now = new Date().toISOString();
        let updatedCount = 0;

        mockNotifications.forEach(notification => {
            if ((notification.userId === null || notification.userId === req.user._id.toString()) && !notification.isRead) {
                notification.isRead = true;
                notification.readAt = now;
                notification.status = 'read';
                updatedCount++;
            }
        });

        res.json({
            success: true,
            message: `${updatedCount} notifications marked as read`,
            data: { updatedCount }
        });
    } catch (error) {
        logger.error('Mark all notifications as read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark all notifications as read',
            errorType: 'MARK_ALL_READ_ERROR'
        });
    }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const notificationIndex = mockNotifications.findIndex(n => n._id === req.params.id);

        if (notificationIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found',
                errorType: 'NOTIFICATION_NOT_FOUND'
            });
        }

        const notification = mockNotifications[notificationIndex];

        // Check if user can delete this notification
        if (notification.userId && notification.userId !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                errorType: 'ACCESS_DENIED'
            });
        }

        mockNotifications.splice(notificationIndex, 1);

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        logger.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete notification',
            errorType: 'DELETE_NOTIFICATION_ERROR'
        });
    }
});

export default router;
