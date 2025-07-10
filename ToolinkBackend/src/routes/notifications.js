const express = require('express');
const Notification = require('../models/Notification');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get notifications for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      category,
      priority,
      includeArchived = false
    } = req.query;
    
    const options = {
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      category,
      priority,
      includeArchived: includeArchived === 'true'
    };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const notifications = await Notification.findForUser(req.user._id, options)
      .populate('sender.userId', 'fullName username')
      .populate('relatedEntityId')
      .skip(skip);
    
    const totalCount = await Notification.countDocuments({
      $or: [
        { 'recipient.userId': req.user._id },
        { 'recipient.role': 'all' }
      ],
      isArchived: options.includeArchived
    });
    
    const unreadCount = await Notification.getUnreadCount(req.user._id);
    
    res.json({
      success: true,
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        unreadCount
      }
    });
    
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      errorType: 'FETCH_NOTIFICATIONS_ERROR'
    });
  }
});

// Get unread notifications count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);
    
    res.json({
      success: true,
      unreadCount: count
    });
    
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count',
      errorType: 'FETCH_UNREAD_COUNT_ERROR'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
        errorType: 'NOTIFICATION_NOT_FOUND'
      });
    }
    
    // Check if user can mark this notification as read
    const canRead = notification.recipient.userId?.toString() === req.user._id.toString() ||
                   notification.recipient.role === 'all' ||
                   notification.recipient.role === req.user.role;
    
    if (!canRead) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        errorType: 'ACCESS_DENIED'
      });
    }
    
    await notification.markAsRead(req.user._id);
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      errorType: 'MARK_READ_ERROR'
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.findUnread(req.user._id);
    
    const updatePromises = notifications.map(notification => 
      notification.markAsRead(req.user._id)
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: `Marked ${notifications.length} notifications as read`
    });
    
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
      errorType: 'MARK_ALL_READ_ERROR'
    });
  }
});

// Archive notification
router.patch('/:id/archive', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
        errorType: 'NOTIFICATION_NOT_FOUND'
      });
    }
    
    // Check if user can archive this notification
    const canArchive = notification.recipient.userId?.toString() === req.user._id.toString() ||
                      req.user.role === 'admin';
    
    if (!canArchive) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        errorType: 'ACCESS_DENIED'
      });
    }
    
    await notification.archive(req.user._id);
    
    res.json({
      success: true,
      message: 'Notification archived successfully'
    });
    
  } catch (error) {
    console.error('Archive notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive notification',
      errorType: 'ARCHIVE_ERROR'
    });
  }
});

// Create notification (admin only)
router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const {
      title,
      message,
      type = 'info',
      category,
      priority = 'normal',
      recipient,
      channels = { inApp: true },
      relatedEntity,
      relatedEntityId,
      actionUrl,
      actionText,
      metadata,
      scheduledFor,
      expiresAt
    } = req.body;
    
    // Validation
    if (!title || !message || !category) {
      return res.status(400).json({
        success: false,
        error: 'Title, message, and category are required',
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    if (!recipient || (!recipient.userId && !recipient.role)) {
      return res.status(400).json({
        success: false,
        error: 'Recipient userId or role is required',
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    const notificationData = {
      title,
      message,
      type,
      category,
      priority,
      recipient: {
        userId: recipient.userId,
        role: recipient.role,
        specific: !!recipient.userId
      },
      sender: {
        userId: req.user._id,
        system: false,
        name: req.user.fullName
      },
      channels,
      relatedEntity,
      relatedEntityId,
      actionUrl,
      actionText,
      metadata,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    };
    
    const notification = new Notification(notificationData);
    await notification.save();
    
    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender.userId', 'fullName username')
      .populate('recipient.userId', 'fullName username');
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification: populatedNotification
    });
    
  } catch (error) {
    console.error('Create notification error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map(e => e.message).join(', '),
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create notification',
      errorType: 'CREATE_NOTIFICATION_ERROR'
    });
  }
});

// Broadcast notification to role (admin only)
router.post('/broadcast', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const {
      title,
      message,
      type = 'info',
      category,
      priority = 'normal',
      targetRole = 'all',
      channels = { inApp: true },
      expiresAt
    } = req.body;
    
    if (!title || !message || !category) {
      return res.status(400).json({
        success: false,
        error: 'Title, message, and category are required',
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    const notificationData = {
      title,
      message,
      type,
      category,
      priority,
      recipient: {
        role: targetRole,
        specific: false
      },
      sender: {
        userId: req.user._id,
        system: false,
        name: req.user.fullName
      },
      channels,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    };
    
    const notification = new Notification(notificationData);
    await notification.save();
    
    res.status(201).json({
      success: true,
      message: `Broadcast notification sent to ${targetRole === 'all' ? 'all users' : targetRole + ' users'}`,
      notification
    });
    
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast notification',
      errorType: 'BROADCAST_ERROR'
    });
  }
});

// Get notifications by role (admin only)
router.get('/role/:role', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const notifications = await Notification.findByRole(role)
      .populate('sender.userId', 'fullName username')
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalCount = await Notification.countDocuments({
      'recipient.role': { $in: [role, 'all'] },
      isArchived: false
    });
    
    res.json({
      success: true,
      notifications,
      role,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount
      }
    });
    
  } catch (error) {
    console.error('Get notifications by role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications by role',
      errorType: 'FETCH_BY_ROLE_ERROR'
    });
  }
});

// Get notification statistics (admin only)
router.get('/stats/summary', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments({ isArchived: false });
    const unreadNotifications = await Notification.countDocuments({
      status: { $ne: 'read' },
      isArchived: false
    });
    
    const categoryStats = await Notification.aggregate([
      { $match: { isArchived: false } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $ne: ['$status', 'read'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const priorityStats = await Notification.aggregate([
      { $match: { isArchived: false } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const recentNotifications = await Notification.find({ isArchived: false })
      .populate('sender.userId', 'fullName username')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title type category priority createdAt sender');
    
    res.json({
      success: true,
      stats: {
        totalNotifications,
        unreadNotifications,
        readNotifications: totalNotifications - unreadNotifications,
        categoryStats,
        priorityStats,
        recentNotifications
      }
    });
    
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification statistics',
      errorType: 'FETCH_STATS_ERROR'
    });
  }
});

// Clean up expired notifications (system endpoint)
router.delete('/cleanup/expired', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const expiredNotifications = await Notification.findExpired();
    
    // Archive expired notifications instead of deleting
    const archivePromises = expiredNotifications.map(notification => 
      notification.archive(req.user._id)
    );
    
    await Promise.all(archivePromises);
    
    res.json({
      success: true,
      message: `Archived ${expiredNotifications.length} expired notifications`
    });
    
  } catch (error) {
    console.error('Cleanup expired notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup expired notifications',
      errorType: 'CLEANUP_ERROR'
    });
  }
});

// Get single notification
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('sender.userId', 'fullName username')
      .populate('recipient.userId', 'fullName username')
      .populate('relatedEntityId');
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
        errorType: 'NOTIFICATION_NOT_FOUND'
      });
    }
    
    // Check if user can access this notification
    const canAccess = notification.recipient.userId?.toString() === req.user._id.toString() ||
                     notification.recipient.role === 'all' ||
                     notification.recipient.role === req.user.role ||
                     req.user.role === 'admin';
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        errorType: 'ACCESS_DENIED'
      });
    }
    
    // Auto-mark as read when accessed
    if (!notification.isRead && notification.recipient.userId?.toString() === req.user._id.toString()) {
      await notification.markAsRead(req.user._id);
    }
    
    res.json({
      success: true,
      notification
    });
    
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification',
      errorType: 'FETCH_NOTIFICATION_ERROR'
    });
  }
});

module.exports = router;
