import express from 'express';
import Message from '../models/Message.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleAuth.js';
import auditLogger from '../middleware/auditLogger.js';
import User from '../models/User.js';

const router = express.Router();

// Public endpoint to create a contact message (no authentication required)
router.post('/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // Create message document
        const contactMessage = new Message({
            type: 'contact',
            sender: null, // No authenticated user for contact form
            recipient: null, // Will be handled by admin/cashier
            subject,
            content: message,
            status: 'pending',
            priority: 'normal',
            metadata: {
                contactForm: {
                    name,
                    email,
                    submittedAt: new Date()
                }
            }
        });

        await contactMessage.save();

        // Log the contact form submission
        console.log(`New contact message from ${name} (${email}): ${subject}`);

        res.status(201).json({
            success: true,
            message: 'Your message has been sent successfully. We will get back to you soon!',
            data: {
                id: contactMessage._id,
                status: 'submitted'
            }
        });

    } catch (error) {
        console.error('Error creating contact message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send message. Please try again later.'
        });
    }
});

// Get all messages (admin/cashier only)
router.get('/', authenticateToken, requireRole('admin', 'cashier'), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            type,
            priority,
            search
        } = req.query;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (priority) filter.priority = priority;

        // Add search functionality
        if (search) {
            filter.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { 'metadata.contactForm.name': { $regex: search, $options: 'i' } },
                { 'metadata.contactForm.email': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const messages = await Message.find(filter)
            .populate('sender', 'firstName lastName email role')
            .populate('recipient', 'firstName lastName email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Message.countDocuments(filter);

        // Log the access
        auditLogger.log('MESSAGE_ACCESS', req.user.id, {
            action: 'list_messages',
            filter,
            resultsCount: messages.length
        });

        res.json({
            success: true,
            data: {
                messages,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    total
                }
            }
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages'
        });
    }
});

// Get a specific message (admin/cashier only)
router.get('/:id', authenticateToken, requireRole('admin', 'cashier'), async (req, res) => {
    try {
        const message = await Message.findById(req.params.id)
            .populate('sender', 'firstName lastName email role')
            .populate('recipient', 'firstName lastName email role')
            .populate('thread.author', 'firstName lastName email role');

        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }

        // Mark as read if not already
        if (message.status === 'pending') {
            message.status = 'read';
            message.readAt = new Date();
            await message.save();
        }

        // Log the access
        auditLogger.log('MESSAGE_ACCESS', req.user.id, {
            action: 'view_message',
            messageId: message._id,
            messageType: message.type
        });

        res.json({
            success: true,
            data: message
        });

    } catch (error) {
        console.error('Error fetching message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch message'
        });
    }
});

// Reply to a message (admin/cashier only)
router.post('/:id/reply', authenticateToken, requireRole('admin', 'cashier'), async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Reply content is required'
            });
        }

        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }

        // Add reply to thread
        message.thread.push({
            author: req.user.id,
            content: content.trim(),
            timestamp: new Date()
        });

        message.status = 'replied';
        message.lastReplyAt = new Date();

        await message.save();

        // Populate the new reply
        await message.populate('thread.author', 'firstName lastName email role');

        // Log the reply
        auditLogger.log('MESSAGE_REPLY', req.user.id, {
            action: 'reply_to_message',
            messageId: message._id,
            messageType: message.type
        });

        res.json({
            success: true,
            message: 'Reply sent successfully',
            data: message
        });

    } catch (error) {
        console.error('Error replying to message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send reply'
        });
    }
});

// Update message status (admin/cashier only)
router.patch('/:id/status', authenticateToken, requireRole('admin', 'cashier'), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'read', 'replied', 'resolved', 'archived'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status value'
            });
        }

        const message = await Message.findByIdAndUpdate(
            req.params.id,
            {
                status,
                ...(status === 'resolved' && { resolvedAt: new Date() }),
                ...(status === 'archived' && { archivedAt: new Date() })
            },
            { new: true }
        ).populate('sender', 'firstName lastName email role')
            .populate('recipient', 'firstName lastName email role');

        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }

        // Log the status update
        auditLogger.log('MESSAGE_STATUS_UPDATE', req.user.id, {
            action: 'update_message_status',
            messageId: message._id,
            oldStatus: message.status,
            newStatus: status
        });

        res.json({
            success: true,
            message: 'Message status updated successfully',
            data: message
        });

    } catch (error) {
        console.error('Error updating message status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update message status'
        });
    }
});

// Delete a message (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const message = await Message.findByIdAndDelete(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }

        // Log the deletion
        auditLogger.log('MESSAGE_DELETE', req.user.id, {
            action: 'delete_message',
            messageId: req.params.id,
            messageType: message.type
        });

        res.json({
            success: true,
            message: 'Message deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete message'
        });
    }
});

// Get message statistics (admin/cashier only)
router.get('/stats/overview', authenticateToken, requireRole('admin', 'cashier'), async (req, res) => {
    try {
        const stats = await Message.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
                    replied: { $sum: { $cond: [{ $eq: ['$status', 'replied'] }, 1, 0] } },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                    archived: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } },
                    contactMessages: { $sum: { $cond: [{ $eq: ['$type', 'contact'] }, 1, 0] } },
                    supportMessages: { $sum: { $cond: [{ $eq: ['$type', 'support'] }, 1, 0] } }
                }
            }
        ]);

        const result = stats[0] || {
            total: 0,
            pending: 0,
            read: 0,
            replied: 0,
            resolved: 0,
            archived: 0,
            contactMessages: 0,
            supportMessages: 0
        };

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error fetching message statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

export default router;
