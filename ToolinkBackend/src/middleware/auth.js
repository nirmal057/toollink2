import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Generate JWT tokens
export const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

// Authenticate token middleware
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required',
                errorType: 'MISSING_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password -refreshTokens');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token - user not found',
                errorType: 'INVALID_TOKEN'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account is inactive',
                errorType: 'ACCOUNT_INACTIVE'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                errorType: 'TOKEN_EXPIRED'
            });
        }

        return res.status(401).json({
            success: false,
            error: 'Invalid token',
            errorType: 'INVALID_TOKEN'
        });
    }
};

// Optional authentication middleware
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password -refreshTokens');

            if (user && user.isActive) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

// Authentication-only middleware
export const authOnly = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required',
                errorType: 'MISSING_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password -refreshTokens');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token - user not found',
                errorType: 'INVALID_TOKEN'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account is inactive',
                errorType: 'ACCOUNT_INACTIVE'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                errorType: 'INVALID_TOKEN'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                errorType: 'TOKEN_EXPIRED'
            });
        }

        logger.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed',
            errorType: 'AUTHENTICATION_ERROR'
        });
    }
};

// Authorization middleware
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                errorType: 'AUTHENTICATION_REQUIRED'
            });
        }

        if (roles.length > 0 && !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                errorType: 'INSUFFICIENT_PERMISSIONS',
                requiredRoles: roles,
                userRole: req.user.role
            });
        }

        next();
    };
};

// Admin only middleware
export const adminOnly = [authOnly, authorize('admin')];

// Check if user owns resource or is admin
export const ownerOrAdmin = (getOwnerId) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    errorType: 'AUTHENTICATION_REQUIRED'
                });
            }

            // Admin can access everything
            if (req.user.role === 'admin') {
                return next();
            }

            // Get owner ID from request
            const ownerId = typeof getOwnerId === 'function' ? getOwnerId(req) : req.params.id;

            // Check if user owns the resource
            if (req.user._id.toString() !== ownerId) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied - not owner',
                    errorType: 'ACCESS_DENIED'
                });
            }

            next();
        } catch (error) {
            logger.error('Authorization error:', error);
            return res.status(500).json({
                success: false,
                error: 'Authorization error',
                errorType: 'AUTHORIZATION_ERROR'
            });
        }
    };
};

// Verify refresh token
export const verifyRefreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token required',
                errorType: 'MISSING_REFRESH_TOKEN'
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token',
                errorType: 'INVALID_REFRESH_TOKEN'
            });
        }

        // Check if refresh token exists in user's tokens
        const tokenExists = user.refreshTokens.some(token =>
            token.token === refreshToken && token.expiresAt > new Date()
        );

        if (!tokenExists) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired refresh token',
                errorType: 'INVALID_REFRESH_TOKEN'
            });
        }

        req.user = user;
        req.refreshToken = refreshToken;
        next();
    } catch (error) {
        logger.error('Refresh token verification error:', error);
        return res.status(401).json({
            success: false,
            error: 'Invalid refresh token',
            errorType: 'INVALID_REFRESH_TOKEN'
        });
    }
};

// Rate limiting for authentication
export const authRateLimit = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
};

// Role-based permission middleware
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                errorType: 'AUTHENTICATION_REQUIRED'
            });
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
                errorType: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
};
