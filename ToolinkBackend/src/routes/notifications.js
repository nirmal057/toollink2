import express from 'express';
import { authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Mock notification data
const mockNotifications = [
    {
        id: '1',
        userId: null, // System notification
        type: 'system',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight at 2 AM',
        priority: 'medium',
        read: false,
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        userId: null,
        type: 'inventory',
        title: 'Low Stock Alert',
        message: 'Tool A is running low on stock (5 remaining)',
        priority: 'high',
        read: false,
        createdAt: new Date().toISOString()
    },
    {
        id: '3',
        userId: null,
        type: 'order',
        title: 'New Order Received',
        message: 'Order ORD-001 has been placed and needs approval',
        priority: 'medium',
        read: false,
        createdAt: new Date().toISOString()
    }
];

// Get all notifications for user
router.get('/', async (req, res) => {
    try {
        const { type, priority, read, page = 1, limit = 20 } = req.query;

        let filteredNotifications = mockNotifications.filter(n =>
            n.userId === null || n.userId === req.user._id.toString()
        );

        if (type) {
            filteredNotifications = filteredNotifications.filter(n => n.type === type);
        }

        if (priority) {
            filteredNotifications = filteredNotifications.filter(n => n.priority === priority);
        }

        if (read !== undefined) {
            filteredNotifications = filteredNotifications.filter(n => n.read === (read === 'true'));
        }

        // Sort by creation date (newest first)
        filteredNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginatedNotifications = filteredNotifications.slice(skip, skip + parseInt(limit));

        res.json({
            success: true,
            data: paginatedNotifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: filteredNotifications.length,
                pages: Math.ceil(filteredNotifications.length / parseInt(limit))
            }
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
router.get('/stats', async (req, res) => {
    try {
        const userNotifications = mockNotifications.filter(n =>
            n.userId === null || n.userId === req.user._id.toString()
        );

        const stats = {
            total: userNotifications.length,
            unread: userNotifications.filter(n => !n.read).length,
            read: userNotifications.filter(n => n.read).length,
            byType: {
                system: userNotifications.filter(n => n.type === 'system').length,
                inventory: userNotifications.filter(n => n.type === 'inventory').length,
                order: userNotifications.filter(n => n.type === 'order').length,
                delivery: userNotifications.filter(n => n.type === 'delivery').length
            },
            byPriority: {
                high: userNotifications.filter(n => n.priority === 'high').length,
                medium: userNotifications.filter(n => n.priority === 'medium').length,
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

// Get single notification
router.get('/:id', async (req, res) => {
    try {
        const notification = mockNotifications.find(n => n.id === req.params.id);

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
router.patch('/:id/read', async (req, res) => {
    try {
        const notificationIndex = mockNotifications.findIndex(n => n.id === req.params.id);

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

        mockNotifications[notificationIndex].read = true;
        mockNotifications[notificationIndex].readAt = new Date().toISOString();

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
router.patch('/read-all', async (req, res) => {
    try {
        const now = new Date().toISOString();
        let updatedCount = 0;

        mockNotifications.forEach(notification => {
            if ((notification.userId === null || notification.userId === req.user._id.toString()) && !notification.read) {
                notification.read = true;
                notification.readAt = now;
                updatedCount++;
            }
        });

        res.json({
            success: true,
            message: `${updatedCount} notifications marked as read`,
            count: updatedCount
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
router.delete('/:id', async (req, res) => {
    try {
        const notificationIndex = mockNotifications.findIndex(n => n.id === req.params.id);

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
