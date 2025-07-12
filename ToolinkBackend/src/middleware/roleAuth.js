import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Role hierarchy - higher roles include lower role permissions
const ROLE_HIERARCHY = {
    'admin': ['admin', 'warehouse', 'cashier', 'editor', 'driver', 'user', 'customer'],
    'warehouse': ['warehouse', 'user'],
    'cashier': ['cashier', 'customer'],
    'editor': ['editor', 'user'],
    'driver': ['driver'],
    'user': ['user'],
    'customer': ['customer']
};

// Role permissions for different features
const ROLE_PERMISSIONS = {
    // User Management
    'users.view': ['admin'],
    'users.create': ['admin'],
    'users.edit': ['admin'],
    'users.delete': ['admin'],

    // Inventory Management
    'inventory.view': ['admin', 'warehouse', 'cashier'],
    'inventory.create': ['admin', 'warehouse'],
    'inventory.edit': ['admin', 'warehouse'],
    'inventory.delete': ['admin', 'warehouse'],

    // Order Management
    'orders.view': ['admin', 'warehouse', 'cashier', 'customer'],
    'orders.create': ['admin', 'warehouse', 'cashier', 'customer'],
    'orders.edit': ['admin', 'warehouse', 'cashier'],
    'orders.cancel': ['admin', 'warehouse', 'customer'],
    'orders.fulfill': ['admin', 'warehouse'],

    // Delivery Management
    'delivery.view': ['admin', 'warehouse', 'driver'],
    'delivery.assign': ['admin', 'warehouse'],
    'delivery.update': ['admin', 'warehouse', 'driver'],
    'delivery.complete': ['admin', 'warehouse', 'driver'],

    // Reports
    'reports.view': ['admin', 'warehouse', 'cashier'],
    'reports.financial': ['admin'],
    'reports.inventory': ['admin', 'warehouse'],
    'reports.sales': ['admin', 'cashier'],

    // Content Management
    'content.view': ['admin', 'editor'],
    'content.create': ['admin', 'editor'],
    'content.edit': ['admin', 'editor'],
    'content.publish': ['admin', 'editor'],

    // Customer Features
    'profile.view': ['admin', 'warehouse', 'cashier', 'editor', 'driver', 'user', 'customer'],
    'profile.edit': ['admin', 'warehouse', 'cashier', 'editor', 'driver', 'user', 'customer'],
    'orders.own': ['customer', 'user'],

    // Dashboard Access
    'dashboard.admin': ['admin'],
    'dashboard.warehouse': ['admin', 'warehouse'],
    'dashboard.cashier': ['admin', 'cashier'],
    'dashboard.customer': ['customer', 'user'],
    'dashboard.driver': ['admin', 'driver'],
    'dashboard.editor': ['admin', 'editor']
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (userRole, permission) => {
    const allowedRoles = ROLE_PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(userRole);
};

/**
 * Check if user role has access to another role's data
 */
export const hasRoleAccess = (userRole, targetRole) => {
    const hierarchy = ROLE_HIERARCHY[userRole];
    if (!hierarchy) return false;
    return hierarchy.includes(targetRole);
};

/**
 * Middleware to check if user has specific permission
 */
export const requirePermission = (permission) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    errorType: 'AUTH_REQUIRED'
                });
            }

            if (!hasPermission(req.user.role, permission)) {
                logger.warn(`Access denied: User ${req.user.email} (${req.user.role}) attempted to access ${permission}`);
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                    errorType: 'INSUFFICIENT_PERMISSIONS',
                    required: permission,
                    userRole: req.user.role
                });
            }

            next();
        } catch (error) {
            logger.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                error: 'Permission check failed',
                errorType: 'PERMISSION_CHECK_ERROR'
            });
        }
    };
};

/**
 * Middleware to check if user has one of multiple permissions
 */
export const requireAnyPermission = (permissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    errorType: 'AUTH_REQUIRED'
                });
            }

            const hasAnyPermission = permissions.some(permission =>
                hasPermission(req.user.role, permission)
            );

            if (!hasAnyPermission) {
                logger.warn(`Access denied: User ${req.user.email} (${req.user.role}) attempted to access one of ${permissions.join(', ')}`);
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                    errorType: 'INSUFFICIENT_PERMISSIONS',
                    required: permissions,
                    userRole: req.user.role
                });
            }

            next();
        } catch (error) {
            logger.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                error: 'Permission check failed',
                errorType: 'PERMISSION_CHECK_ERROR'
            });
        }
    };
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (...roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    errorType: 'AUTH_REQUIRED'
                });
            }

            if (!roles.includes(req.user.role)) {
                logger.warn(`Access denied: User ${req.user.email} (${req.user.role}) attempted to access role-restricted endpoint requiring ${roles.join(', ')}`);
                return res.status(403).json({
                    success: false,
                    error: 'Role not authorized',
                    errorType: 'ROLE_NOT_AUTHORIZED',
                    requiredRoles: roles,
                    userRole: req.user.role
                });
            }

            next();
        } catch (error) {
            logger.error('Role check error:', error);
            res.status(500).json({
                success: false,
                error: 'Role check failed',
                errorType: 'ROLE_CHECK_ERROR'
            });
        }
    };
};

/**
 * Get user's dashboard based on role
 */
export const getDashboardAccess = (userRole) => {
    const dashboards = [];

    Object.keys(ROLE_PERMISSIONS).forEach(permission => {
        if (permission.startsWith('dashboard.') && hasPermission(userRole, permission)) {
            dashboards.push(permission.replace('dashboard.', ''));
        }
    });

    return dashboards;
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role) => {
    const permissions = [];

    Object.keys(ROLE_PERMISSIONS).forEach(permission => {
        if (hasPermission(role, permission)) {
            permissions.push(permission);
        }
    });

    return permissions;
};

export default {
    hasPermission,
    hasRoleAccess,
    requirePermission,
    requireAnyPermission,
    requireRole,
    getDashboardAccess,
    getRolePermissions,
    ROLE_HIERARCHY,
    ROLE_PERMISSIONS
};
