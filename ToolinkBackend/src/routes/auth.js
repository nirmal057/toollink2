import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { generateTokens, verifyRefreshToken, authenticateToken, requireRole } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { sendEmail } from '../utils/emailService.js';
import crypto from 'crypto';

const router = express.Router();

// Validation rules
const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
];

const registerValidation = [
    body('username').trim().isLength({ min: 3, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').trim().isLength({ min: 2, max: 100 }),
    body('phone').optional().isMobilePhone(),
    body('role').optional().isIn(['customer', 'user', 'warehouse', 'cashier', 'driver', 'editor'])
];

// Login endpoint
router.post('/login', loginValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user by email or username
        const user = await User.findByEmailOrUsername(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                errorType: 'INVALID_CREDENTIALS'
            });
        }

        // Check if account is locked
        if (user.isLocked) {
            return res.status(423).json({
                success: false,
                error: 'Account is temporarily locked due to multiple failed login attempts',
                errorType: 'ACCOUNT_LOCKED'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account is inactive',
                errorType: 'ACCOUNT_INACTIVE'
            });
        }

        // Check if account is approved
        if (!user.isApproved) {
            return res.status(401).json({
                success: false,
                error: 'Account is pending approval',
                errorType: 'ACCOUNT_PENDING_APPROVAL'
            });
        }

        // Validate password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            await user.incLoginAttempts();
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                errorType: 'INVALID_CREDENTIALS'
            });
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        // Save refresh token
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

        user.refreshTokens.push({
            token: refreshToken,
            expiresAt: refreshTokenExpiry
        });

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Clean up expired refresh tokens
        user.refreshTokens = user.refreshTokens.filter(token => token.expiresAt > new Date());
        await user.save();

        logger.info(`User ${user.email} logged in successfully`);

        res.json({
            success: true,
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                isActive: user.isActive,
                isApproved: user.isApproved,
                emailVerified: user.emailVerified,
                profilePicture: user.profilePicture,
                preferences: user.preferences,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
            errorType: 'LOGIN_ERROR'
        });
    }
});

// Register endpoint
router.post('/register', registerValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { username, email, password, fullName, phone, role = 'customer' } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmailOrUsername(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User already exists',
                errorType: 'USER_EXISTS'
            });
        }

        // Check if username is taken
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                error: 'Username already taken',
                errorType: 'USERNAME_TAKEN'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            fullName,
            phone,
            role,
            isApproved: role === 'customer' ? false : true, // Customers require approval
            emailVerified: false
        });

        // Generate email verification token
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();

        // Send verification email
        try {
            await sendEmail({
                to: user.email,
                subject: 'Verify your email address',
                template: 'email-verification',
                data: {
                    fullName: user.fullName,
                    verificationToken,
                    verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
                }
            });
        } catch (emailError) {
            logger.error('Email verification sending failed:', emailError);
        }

        logger.info(`New user registered: ${user.email}`);

        res.status(201).json({
            success: true,
            message: role === 'customer' && !user.isApproved ?
                'Registration successful. Your account is pending approval by an admin or cashier.' :
                'Registration successful. Please check your email to verify your account.',
            requiresApproval: role === 'customer' && !user.isApproved,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                isActive: user.isActive,
                isApproved: user.isApproved,
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed',
            errorType: 'REGISTRATION_ERROR'
        });
    }
});

// Refresh token endpoint
router.post('/refresh-token', verifyRefreshToken, async (req, res) => {
    try {
        const { user, refreshToken } = req;

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

        // Remove old refresh token and add new one
        user.refreshTokens = user.refreshTokens.filter(token => token.token !== refreshToken);

        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

        user.refreshTokens.push({
            token: newRefreshToken,
            expiresAt: refreshTokenExpiry
        });

        await user.save();

        res.json({
            success: true,
            accessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        logger.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            error: 'Token refresh failed',
            errorType: 'TOKEN_REFRESH_ERROR'
        });
    }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            // Find user and remove refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const user = await User.findById(decoded.userId);

            if (user) {
                user.refreshTokens = user.refreshTokens.filter(token => token.token !== refreshToken);
                await user.save();
            }
        }

        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        logger.error('Logout error:', error);
        res.json({
            success: true,
            message: 'Logout successful'
        });
    }
});

// Get current user endpoint
router.get('/me', async (req, res) => {
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
                error: 'User not found',
                errorType: 'USER_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                isActive: user.isActive,
                isApproved: user.isApproved,
                emailVerified: user.emailVerified,
                profilePicture: user.profilePicture,
                preferences: user.preferences,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        logger.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user information',
            errorType: 'GET_USER_ERROR'
        });
    }
});

// Forgot password endpoint
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail()
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

        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                success: true,
                message: 'If a user with that email exists, a password reset link has been sent.'
            });
        }

        // Generate reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // Send reset email
        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Reset Request',
                template: 'password-reset',
                data: {
                    fullName: user.fullName,
                    resetToken,
                    resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
                }
            });
        } catch (emailError) {
            logger.error('Password reset email sending failed:', emailError);
        }

        res.json({
            success: true,
            message: 'If a user with that email exists, a password reset link has been sent.'
        });
    } catch (error) {
        logger.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process password reset request',
            errorType: 'FORGOT_PASSWORD_ERROR'
        });
    }
});

// Reset password endpoint
router.post('/reset-password', [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 })
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

        const { token, password } = req.body;

        // Hash the token
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token',
                errorType: 'INVALID_RESET_TOKEN'
            });
        }

        // Update password
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.loginAttempts = 0;
        user.lockUntil = undefined;

        await user.save();

        logger.info(`Password reset successful for user: ${user.email}`);

        res.json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        logger.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset password',
            errorType: 'RESET_PASSWORD_ERROR'
        });
    }
});

// Verify email endpoint
router.post('/verify-email', [
    body('token').notEmpty()
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

        const { token } = req.body;

        // Hash the token
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid verification token
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired verification token',
                errorType: 'INVALID_VERIFICATION_TOKEN'
            });
        }

        // Verify email
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;

        await user.save();

        logger.info(`Email verification successful for user: ${user.email}`);

        res.json({
            success: true,
            message: 'Email verification successful'
        });
    } catch (error) {
        logger.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify email',
            errorType: 'EMAIL_VERIFICATION_ERROR'
        });
    }
});

// Get pending users (customers waiting for approval)
router.get('/pending-users', authenticateToken, requireRole(['admin', 'cashier']), async (req, res) => {
    try {
        const pendingUsers = await User.find({
            isApproved: false,
            isActive: true,
            role: 'customer'
        }).select('-password -refreshTokens').sort({ createdAt: -1 });

        logger.info(`Found ${pendingUsers.length} pending users for approval`);

        res.json({
            success: true,
            users: pendingUsers
        });
    } catch (error) {
        logger.error('Error fetching pending users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pending users',
            errorType: 'FETCH_PENDING_USERS_ERROR'
        });
    }
});

// Approve user
router.post('/approve-user', [
    body('userId').notEmpty()
], authenticateToken, requireRole(['admin', 'cashier']), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                errorType: 'USER_NOT_FOUND'
            });
        }

        if (user.isApproved) {
            return res.status(400).json({
                success: false,
                error: 'User is already approved',
                errorType: 'USER_ALREADY_APPROVED'
            });
        }

        // Approve the user
        user.isApproved = true;
        await user.save();

        // Log the approval action
        logger.info(`User ${user.email} approved by ${req.user.email}`);

        // Send approval notification email
        try {
            await sendEmail({
                to: user.email,
                subject: 'Account Approved - Welcome to ToolLink!',
                template: 'account-approved',
                data: {
                    fullName: user.fullName,
                    loginUrl: `${process.env.FRONTEND_URL}/auth/login`
                }
            });
        } catch (emailError) {
            logger.error('Failed to send approval email:', emailError);
        }

        res.json({
            success: true,
            message: 'User approved successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                isApproved: user.isApproved,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        logger.error('Error approving user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to approve user',
            errorType: 'USER_APPROVAL_ERROR'
        });
    }
});

// Reject user
router.post('/reject-user', [
    body('userId').notEmpty(),
    body('reason').optional().isString()
], authenticateToken, requireRole(['admin', 'cashier']), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { userId, reason = 'No reason provided' } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                errorType: 'USER_NOT_FOUND'
            });
        }

        if (user.isApproved) {
            return res.status(400).json({
                success: false,
                error: 'Cannot reject an approved user',
                errorType: 'USER_ALREADY_APPROVED'
            });
        }

        // Log the rejection action
        logger.info(`User ${user.email} rejected by ${req.user.email}. Reason: ${reason}`);

        // Send rejection notification email
        try {
            await sendEmail({
                to: user.email,
                subject: 'Account Registration Update - ToolLink',
                template: 'account-rejected',
                data: {
                    fullName: user.fullName,
                    reason: reason,
                    supportEmail: process.env.SUPPORT_EMAIL || 'support@toollink.com'
                }
            });
        } catch (emailError) {
            logger.error('Failed to send rejection email:', emailError);
        }

        // Delete the rejected user
        await User.findByIdAndDelete(userId);

        res.json({
            success: true,
            message: 'User rejected and removed successfully'
        });
    } catch (error) {
        logger.error('Error rejecting user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reject user',
            errorType: 'USER_REJECTION_ERROR'
        });
    }
});

export default router;
