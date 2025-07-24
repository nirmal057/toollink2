import express from 'express';
import { authenticateToken, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';
// import AuditLog from '../models/AuditLog.js';
// import { AuditLogger } from '../middleware/auditLogger.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get dashboard data
router.get('/dashboard', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const [userStats, roleDistribution, orderStats, inventoryStats] = await Promise.all([
            User.getStatistics(),
            User.getRoleDistribution(),
            Order.getStatistics(),
            Inventory.getStatistics()
        ]);

        // Add role distribution to user stats
        const enhancedUserStats = {
            ...userStats,
            roleDistribution
        };

        const dashboardData = {
            users: enhancedUserStats,
            orders: orderStats,
            inventory: inventoryStats,
            systemInfo: {
                uptime: process.uptime(),
                nodeVersion: process.version,
                platform: process.platform,
                memoryUsage: process.memoryUsage(),
                timestamp: new Date().toISOString()
            }
        };

        res.json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        logger.error('Get admin dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data',
            errorType: 'FETCH_DASHBOARD_ERROR'
        });
    }
});

// Get system audit logs
router.get('/audit-logs', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 50, action, userId, startDate, endDate } = req.query;

        // Mock audit logs for now
        const mockAuditLogs = [
            {
                id: '1',
                action: 'user_created',
                userId: req.user._id,
                targetId: 'user123',
                details: { email: 'newuser@example.com', role: 'customer' },
                timestamp: new Date().toISOString(),
                ip: '192.168.1.100'
            },
            {
                id: '2',
                action: 'inventory_updated',
                userId: req.user._id,
                targetId: 'inv456',
                details: { name: 'Tool A', quantity: 50 },
                timestamp: new Date().toISOString(),
                ip: '192.168.1.100'
            },
            {
                id: '3',
                action: 'order_status_changed',
                userId: req.user._id,
                targetId: 'ord789',
                details: { from: 'pending', to: 'confirmed' },
                timestamp: new Date().toISOString(),
                ip: '192.168.1.100'
            }
        ];

        // Filter logs
        let filteredLogs = mockAuditLogs;

        if (action) {
            filteredLogs = filteredLogs.filter(log => log.action === action);
        }

        if (userId) {
            filteredLogs = filteredLogs.filter(log => log.userId === userId);
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginatedLogs = filteredLogs.slice(skip, skip + parseInt(limit));

        res.json({
            success: true,
            data: paginatedLogs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: filteredLogs.length,
                pages: Math.ceil(filteredLogs.length / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit logs',
            errorType: 'FETCH_AUDIT_LOGS_ERROR'
        });
    }
});

// Get system reports
router.get('/reports', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { type = 'summary', startDate, endDate } = req.query;

        const reports = {
            summary: {
                users: await User.getStatistics(),
                orders: await Order.getStatistics(),
                inventory: await Inventory.getStatistics(),
                generatedAt: new Date().toISOString()
            },
            users: {
                total: await User.countDocuments({ deletedAt: null }),
                byRole: await User.getRoleDistribution(),
                activeUsers: await User.countDocuments({ isActive: true, deletedAt: null }),
                verifiedUsers: await User.countDocuments({ emailVerified: true, deletedAt: null })
            },
            orders: {
                total: await Order.countDocuments({ deletedAt: null }),
                byStatus: await Order.aggregate([
                    { $match: { deletedAt: null } },
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]),
                revenue: await Order.aggregate([
                    { $match: { deletedAt: null, status: { $in: ['delivered', 'shipped'] } } },
                    { $group: { _id: null, total: { $sum: '$finalAmount' } } }
                ])
            },
            inventory: {
                total: await Inventory.countDocuments({ deletedAt: null }),
                byCategory: await Inventory.aggregate([
                    { $match: { deletedAt: null } },
                    { $group: { _id: '$category', count: { $sum: 1 } } }
                ]),
                lowStock: await Inventory.countDocuments({
                    deletedAt: null,
                    $expr: { $lte: ['$current_stock', '$min_stock_level'] }
                })
            }
        };

        res.json({
            success: true,
            data: reports[type] || reports.summary
        });
    } catch (error) {
        logger.error('Get admin reports error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reports',
            errorType: 'FETCH_REPORTS_ERROR'
        });
    }
});

// Get system configuration
router.get('/config', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const config = {
            system: {
                name: 'ToolLink Management System',
                version: '1.0.0',
                environment: process.env.NODE_ENV,
                uptime: process.uptime(),
                nodeVersion: process.version
            },
            database: {
                status: 'connected',
                name: 'toollink'
            },
            features: {
                emailNotifications: true,
                fileUploads: true,
                auditLogging: true,
                multiRole: true
            },
            limits: {
                maxFileSize: process.env.MAX_FILE_SIZE || '10MB',
                maxUsers: 1000,
                maxOrders: 10000,
                maxInventoryItems: 5000
            }
        };

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        logger.error('Get admin config error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch configuration',
            errorType: 'FETCH_CONFIG_ERROR'
        });
    }
});

// Update system configuration
router.put('/config', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { features, limits } = req.body;

        // In a real application, you would save this to a configuration collection
        // For now, we'll just return the updated config

        const updatedConfig = {
            features,
            limits,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user._id
        };

        logger.info(`System configuration updated by ${req.user.fullName}`);

        res.json({
            success: true,
            message: 'Configuration updated successfully',
            data: updatedConfig
        });
    } catch (error) {
        logger.error('Update admin config error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update configuration',
            errorType: 'UPDATE_CONFIG_ERROR'
        });
    }
});

export default router;
