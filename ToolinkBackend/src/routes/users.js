import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authorize, adminOnly, authenticateToken, authOnly } from '../middleware/auth.js';
import { getDashboardAccess, getRolePermissions } from '../middleware/roleAuth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', adminOnly, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            role,
            status,
            search = '',
            sort = 'fullName'
        } = req.query;

        const filter = { deletedAt: null };

        if (role) {
            filter.role = role;
        }

        if (status === 'active') {
            filter.isActive = true;
        } else if (status === 'inactive') {
            filter.isActive = false;
        }

        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password -refreshTokens')
                .populate('createdBy', 'fullName email')
                .populate('updatedBy', 'fullName email')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total,
                hasNextPage: skip + users.length < total,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        logger.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users',
            errorType: 'FETCH_USERS_ERROR'
        });
    }
});

// Get user statistics
router.get('/stats', adminOnly, async (req, res) => {
    try {
        const stats = await User.getStatistics();
        const roleDistribution = await User.getRoleDistribution();

        res.json({
            success: true,
            data: {
                ...stats,
                roleDistribution
            }
        });
    } catch (error) {
        logger.error('Get user statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user statistics',
            errorType: 'FETCH_STATS_ERROR'
        });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password -refreshTokens');

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile',
            errorType: 'FETCH_PROFILE_ERROR'
        });
    }
});

// Update current user profile
router.put('/profile', authenticateToken, [
    body('fullName').optional().trim().isLength({ min: 2, max: 100 }),
    body('phone').optional().isMobilePhone(),
    body('address').optional().isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const allowedUpdates = ['fullName', 'phone', 'address', 'preferences'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                ...updates,
                updatedAt: new Date(),
                updatedBy: req.user._id
            },
            { new: true, runValidators: true }
        ).select('-password -refreshTokens');

        logger.info(`Profile updated for user: ${user.email}`);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile',
            errorType: 'UPDATE_PROFILE_ERROR'
        });
    }
});

// Get user dashboard data based on role
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const dashboards = getDashboardAccess(user.role);
        const permissions = getRolePermissions(user.role);

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role
                },
                dashboards,
                permissions,
                features: {
                    canManageUsers: permissions.includes('users.view'),
                    canManageInventory: permissions.includes('inventory.view'),
                    canManageOrders: permissions.includes('orders.view'),
                    canManageDelivery: permissions.includes('delivery.view'),
                    canViewReports: permissions.includes('reports.view'),
                    canManageContent: permissions.includes('content.view')
                }
            }
        });
    } catch (error) {
        logger.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data',
            errorType: 'FETCH_DASHBOARD_ERROR'
        });
    }
});

// Test endpoint to debug authentication
router.get('/test-auth', authenticateToken, async (req, res) => {
    res.json({
        success: true,
        message: 'Authentication working',
        user: {
            id: req.user._id,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// Get single user
router.get('/:id', adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -refreshTokens')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                errorType: 'USER_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        logger.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user',
            errorType: 'FETCH_USER_ERROR'
        });
    }
});

// Create user (admin only)
router.post('/', adminOnly, [
    body('username').trim().isLength({ min: 3, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').trim().isLength({ min: 2, max: 100 }),
    body('role').isIn([
        'admin',           // Full system access
        'warehouse',       // Warehouse management
        'cashier',         // Point of sale operations
        'customer',        // Customer access
        'driver',          // Delivery operations
        'editor',          // Content management
        'user'             // General user access
    ])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { username, email, password, fullName, phone, role, address } = req.body;

        // Debug logging for password
        logger.info(`Creating user with email: ${email}, role: ${role}, password provided: ${!!password}`);

        // Check if user already exists
        const existingUser = await User.findByEmailOrUsername(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User already exists',
                errorType: 'USER_EXISTS'
            });
        }

        // Ensure password is provided
        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long',
                errorType: 'INVALID_PASSWORD'
            });
        }

        // Create user
        const user = new User({
            username,
            email,
            password,
            fullName,
            phone,
            role,
            address,
            isApproved: true,
            emailVerified: true,
            createdBy: req.user._id
        });

        // Log before save
        logger.info(`Saving user: ${user.email} with role: ${user.role}`);

        await user.save();

        // Log after save with password confirmation
        logger.info(`User created: ${user.email} with role ${user.role} (Password set: ${!!user.password})`);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                isActive: user.isActive,
                isApproved: user.isApproved,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        logger.error('Create user error:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                error: 'Username or email already exists',
                errorType: 'DUPLICATE_USER'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create user',
            errorType: 'CREATE_USER_ERROR'
        });
    }
});

// Update user
router.put('/:id', adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                errorType: 'USER_NOT_FOUND'
            });
        }

        // Prevent admin from modifying themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                error: 'Cannot modify your own account',
                errorType: 'SELF_MODIFICATION_DENIED'
            });
        }

        // Update fields
        const allowedFields = [
            'fullName', 'phone', 'role', 'isActive', 'isApproved',
            'emailVerified', 'address', 'preferences', 'notes'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        });

        user.updatedBy = req.user._id;
        await user.save();

        logger.info(`User updated: ${user.email} by ${req.user.fullName}`);

        res.json({
            success: true,
            message: 'User updated successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                isActive: user.isActive,
                isApproved: user.isApproved,
                emailVerified: user.emailVerified,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        logger.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user',
            errorType: 'UPDATE_USER_ERROR'
        });
    }
});

// Delete user (soft delete)
router.delete('/:id', adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                errorType: 'USER_NOT_FOUND'
            });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete your own account',
                errorType: 'SELF_DELETION_DENIED'
            });
        }

        // Soft delete
        user.deletedAt = new Date();
        user.isActive = false;
        user.updatedBy = req.user._id;
        await user.save();

        logger.info(`User deleted: ${user.email} by ${req.user.fullName}`);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        logger.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete user',
            errorType: 'DELETE_USER_ERROR'
        });
    }
});

// Get users by role
router.get('/role/:role', authorize('admin', 'cashier', 'warehouse'), async (req, res) => {
    try {
        const { role } = req.params;
        const validRoles = [
            'admin',           // Full system access
            'warehouse',       // Warehouse management
            'cashier',         // Point of sale operations
            'customer',        // Customer access
            'driver',          // Delivery operations
            'editor',          // Content management
            'user'             // General user access
        ];

        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role',
                errorType: 'INVALID_ROLE'
            });
        }

        const users = await User.find({
            role,
            isActive: true,
            isApproved: true,
            deletedAt: null
        }).select('fullName username email phone role createdAt')
            .sort({ fullName: 1 });

        res.json({
            success: true,
            users,
            role,
            count: users.length
        });
    } catch (error) {
        logger.error('Get users by role error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users by role',
            errorType: 'FETCH_USERS_BY_ROLE_ERROR'
        });
    }
});

// Bulk operations
router.post('/bulk', adminOnly, async (req, res) => {
    try {
        const { operation, userIds, updateData } = req.body;

        if (!operation || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid bulk operation data',
                errorType: 'INVALID_BULK_DATA'
            });
        }

        const results = [];

        for (const userId of userIds) {
            try {
                const user = await User.findById(userId);

                if (!user) {
                    results.push({ userId, success: false, error: 'User not found' });
                    continue;
                }

                // Prevent admin from modifying themselves
                if (user._id.toString() === req.user._id.toString()) {
                    results.push({ userId, success: false, error: 'Cannot modify your own account' });
                    continue;
                }

                let result;

                switch (operation) {
                    case 'activate':
                        user.isActive = true;
                        user.updatedBy = req.user._id;
                        result = await user.save();
                        break;

                    case 'deactivate':
                        user.isActive = false;
                        user.updatedBy = req.user._id;
                        result = await user.save();
                        break;

                    case 'approve':
                        user.isApproved = true;
                        user.updatedBy = req.user._id;
                        result = await user.save();
                        break;

                    case 'delete':
                        user.deletedAt = new Date();
                        user.isActive = false;
                        user.updatedBy = req.user._id;
                        result = await user.save();
                        break;

                    case 'update':
                        if (updateData) {
                            Object.keys(updateData).forEach(key => {
                                if (key !== '_id' && key !== 'password' && key !== 'email') {
                                    user[key] = updateData[key];
                                }
                            });
                            user.updatedBy = req.user._id;
                            result = await user.save();
                        }
                        break;

                    default:
                        throw new Error(`Unknown operation: ${operation}`);
                }

                results.push({ userId, success: true, data: result });
            } catch (error) {
                results.push({ userId, success: false, error: error.message });
            }
        }

        logger.info(`Bulk user operation ${operation} performed by ${req.user.fullName}`);

        res.json({
            success: true,
            message: `Bulk ${operation} operation completed`,
            results,
            summary: {
                total: userIds.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        });
    } catch (error) {
        logger.error('Bulk user operation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform bulk operation',
            errorType: 'BULK_OPERATION_ERROR'
        });
    }
});

export default router;
