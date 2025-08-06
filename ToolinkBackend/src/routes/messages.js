import express from 'express';
import Message from '../models/Message.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleAuth.js';
import auditLogger from '../middleware/auditLogger.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/emailService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Public endpoint to create a contact message (no authentication required)
router.post('/contact', async (req, res) => {
    try {
        console.log('📨 Contact form submission received');
        console.log('📄 Request body:', JSON.stringify(req.body, null, 2));
        console.log('📊 Content-Type:', req.headers['content-type']);

        const { name, email, subject, message, phone } = req.body;

        console.log('🔍 Extracted fields:');
        console.log('  - name:', name);
        console.log('  - email:', email);
        console.log('  - subject:', subject);
        console.log('  - message:', message);
        console.log('  - phone:', phone);

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
            customerName: name,
            customerEmail: email,
            customerPhone: phone || null,
            subject,
            messages: [{
                content: message,
                sender: 'customer',
                senderName: name,
                timestamp: new Date(),
                isRead: false
            }],
            status: 'open',
            priority: 'normal'
        });

        await contactMessage.save();

        // Log the contact form submission
        console.log(`New contact message from ${name} (${email}): ${subject}`);

        // Send email notification to admin about new contact message
        try {
            // Get admin users to notify
            const adminUsers = await User.find({
                role: { $in: ['admin', 'manager'] },
                isActive: true,
                emailNotifications: { $ne: false } // Only notify if email notifications are not disabled
            }).select('email fullName');

            if (adminUsers.length > 0) {
                // Send notification to each admin
                const emailPromises = adminUsers.map(admin =>
                    sendEmail({
                        to: admin.email,
                        template: 'customer-contact-message',
                        data: {
                            customerName: name,
                            customerEmail: email,
                            customerPhone: phone,
                            subject: subject,
                            message: message,
                            adminName: admin.fullName,
                            adminUrl: process.env.ADMIN_DASHBOARD_URL || 'http://localhost:5173/admin/messages'
                        }
                    })
                );

                await Promise.allSettled(emailPromises);
                logger.info(`Email notifications sent to ${adminUsers.length} admin(s) for new contact message from ${email}`);
            } else {
                logger.warn('No admin users found to notify about new contact message');
            }
        } catch (emailError) {
            logger.error('Failed to send email notification for contact message:', emailError);
            // Don't fail the request if email notification fails
        }

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

// Test route to get messages without authentication (for debugging)
router.get('/test', async (req, res) => {
    try {
        console.log('🧪 Test route: Getting all messages without auth...');

        const messages = await Message.find({})
            .sort({ createdAt: -1 })
            .limit(10);

        console.log(`📊 Found ${messages.length} messages in database`);

        res.json({
            success: true,
            data: messages,
            count: messages.length
        });

    } catch (error) {
        console.error('Error fetching test messages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages'
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
        const message = await Message.findById(req.params.id);

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
        );

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

// Reply to a customer message (admin/cashier only)
router.post('/:messageId/reply', authenticateToken, requireRole('admin', 'cashier'), async (req, res) => {
    try {
        const { messageId } = req.params;
        const { replyMessage, markAsResolved = false } = req.body;

        if (!replyMessage || replyMessage.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Reply message is required'
            });
        }

        // Find the original message
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }

        // Add the reply to the conversation
        const replyData = {
            content: replyMessage.trim(),
            sender: 'admin',
            senderName: req.user.fullName || req.user.username || 'Support Team',
            timestamp: new Date(),
            isRead: true
        };

        message.messages.push(replyData);

        // Update message status
        if (markAsResolved) {
            message.status = 'resolved';
        } else {
            message.status = 'in-progress';
        }

        message.updatedAt = new Date();
        await message.save();

        // Send email reply to customer
        try {
            await sendEmail({
                to: message.customerEmail,
                template: 'customer-message-reply',
                data: {
                    customerName: message.customerName,
                    originalMessage: message.messages[0]?.content || message.subject,
                    replyMessage: replyMessage.trim(),
                    supportAgent: req.user.fullName || req.user.username || 'ToolLink Support Team',
                    contactUrl: process.env.FRONTEND_URL || 'http://localhost:5173/contact'
                }
            });

            logger.info(`Reply email sent to customer: ${message.customerEmail}`);
        } catch (emailError) {
            logger.error('Failed to send reply email to customer:', emailError);
            // Don't fail the request if email sending fails
        }

        // Log the reply action
        auditLogger.log('MESSAGE_REPLY', req.user.id, {
            action: 'reply_to_message',
            messageId: messageId,
            customerEmail: message.customerEmail,
            replyLength: replyMessage.length,
            markAsResolved
        });

        res.json({
            success: true,
            message: 'Reply sent successfully',
            data: {
                messageId: message._id,
                status: message.status,
                replyId: message.messages[message.messages.length - 1]._id,
                emailSent: true
            }
        });

    } catch (error) {
        logger.error('Error sending reply to customer message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send reply'
        });
    }
});

export default router;
