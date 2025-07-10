const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generateTokens, authenticateToken, verifyRefreshToken, authRateLimit } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', authRateLimit(3, 15 * 60 * 1000), async (req, res) => {
  try {
    const { username, email, password, fullName, phone, role } = req.body;
    
    // Validation
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, password, and full name are required',
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: existingUser.email === email.toLowerCase() ? 'Email already registered' : 'Username already taken',
        errorType: 'USER_EXISTS'
      });
    }
    
    // Create new user
    const userData = {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      fullName,
      phone,
      role: role && ['admin', 'user', 'warehouse', 'cashier', 'customer', 'driver', 'editor'].includes(role) ? role : 'customer'
    };
    
    // Auto-approve admins and certain privileged roles
    if (['admin', 'cashier', 'warehouse'].includes(userData.role)) {
      userData.isApproved = true;
      userData.emailVerified = true;
    }
    
    const user = new User(userData);
    await user.save();
    
    // Create notification for admins/cashiers if customer requires approval
    if (!userData.isApproved && userData.role === 'customer') {
      try {
        // Get all admins and cashiers
        const approvers = await User.find({ 
          role: { $in: ['admin', 'cashier'] },
          isApproved: true 
        });

        // Create notification for each approver
        const notifications = approvers.map(approver => ({
          title: 'New Customer Registration',
          message: `New customer ${userData.fullName} (${userData.email}) has registered and requires approval.`,
          category: 'user',
          type: 'info',
          priority: 'normal',
          recipient: {
            userId: approver._id,
            specific: true
          },
          sender: {
            system: true,
            name: 'System'
          },
          data: {
            customerId: user._id,
            customerName: userData.fullName,
            customerEmail: userData.email
          }
        }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      } catch (notificationError) {
        console.error('Failed to create approval notifications:', notificationError);
        // Don't fail the registration if notification creation fails
      }
    }
    
    // Remove sensitive data
    const userResponse = user.toJSON();
    
    res.status(201).json({
      success: true,
      message: userData.isApproved ? 'User registered successfully' : 'User registered successfully. Awaiting approval.',
      user: userResponse,
      requiresApproval: !userData.isApproved
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `${field} already exists`,
        errorType: 'DUPLICATE_KEY'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map(e => e.message).join(', '),
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      errorType: 'REGISTRATION_ERROR'
    });
  }
});

// Login user
router.post('/login', authRateLimit(5, 15 * 60 * 1000), async (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    
    // Support both 'email' and 'identifier' field names for flexibility
    const loginIdentifier = identifier || email;
    
    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/username and password are required',
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { username: loginIdentifier.toLowerCase() }
      ]
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        errorType: 'INVALID_CREDENTIALS'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        errorType: 'INVALID_CREDENTIALS'
      });
    }
    
    // Check if user can login
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
        errorType: 'ACCOUNT_DEACTIVATED'
      });
    }
    
    if (!user.isApproved) {
      return res.status(401).json({
        success: false,
        error: 'Account pending approval',
        errorType: 'ACCOUNT_PENDING_APPROVAL'
      });
    }
    
    if (!user.emailVerified && process.env.NODE_ENV !== 'development') {
      return res.status(401).json({
        success: false,
        error: 'Email not verified',
        errorType: 'EMAIL_NOT_VERIFIED'
      });
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Store refresh token
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days
    
    await user.addRefreshToken(refreshToken, refreshTokenExpiry);
    await user.updateLastLogin();
    
    // Clean expired tokens
    await user.cleanExpiredTokens();
    
    // Prepare user response
    const userResponse = user.toJSON();
    
    res.json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      errorType: 'LOGIN_ERROR'
    });
  }
});

// Refresh token
router.post('/refresh-token', verifyRefreshToken, async (req, res) => {
  try {
    const user = req.user;
    const oldRefreshToken = req.refreshToken;
    
    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Remove old refresh token and add new one
    await user.removeRefreshToken(oldRefreshToken);
    
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
    
    await user.addRefreshToken(refreshToken, refreshTokenExpiry);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      errorType: 'TOKEN_REFRESH_ERROR'
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await req.user.removeRefreshToken(refreshToken);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      errorType: 'LOGOUT_ERROR'
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshTokens')
      .populate('approvedBy', 'fullName username');
    
    res.json({
      success: true,
      user: user.toJSON()
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information',
      errorType: 'GET_USER_ERROR'
    });
  }
});

// Update user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = ['fullName', 'phone', 'address', 'preferences'];
    const updates = {};
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid updates provided',
        errorType: 'NO_UPDATES'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map(e => e.message).join(', '),
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Profile update failed',
      errorType: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long',
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
        errorType: 'INVALID_PASSWORD'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Clear all refresh tokens to force re-login
    user.refreshTokens = [];
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
    
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Password change failed',
      errorType: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// Get pending users (admin and cashier only)
router.get('/pending-users', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'cashier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Admin or cashier access required',
        errorType: 'ACCESS_DENIED'
      });
    }
    
    const pendingUsers = await User.find({
      isApproved: false,
      isActive: true
    }).select('-password -refreshTokens').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      users: pendingUsers
    });
    
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending users',
      errorType: 'GET_PENDING_USERS_ERROR'
    });
  }
});

// Approve user (admin and cashier only)
router.post('/approve-user', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'cashier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Admin or cashier access required',
        errorType: 'ACCESS_DENIED'
      });
    }
    
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isApproved: true,
        emailVerified: true,
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    ).select('-password -refreshTokens');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        errorType: 'USER_NOT_FOUND'
      });
    }

    // Create approval notification for the user
    try {
      await new Notification({
        title: 'Account Approved',
        message: `Your account has been approved by ${req.user.fullName || req.user.username}. You can now log in to access all features.`,
        category: 'system',
        type: 'success',
        priority: 'high',
        recipient: {
          userId: user._id,
          specific: true
        },
        sender: {
          userId: req.user._id,
          system: false,
          name: req.user.fullName || req.user.username
        },
        data: {
          approvedBy: req.user._id,
          approverName: req.user.fullName || req.user.username,
          approvedAt: new Date()
        }
      }).save();
    } catch (notificationError) {
      console.error('Failed to create approval notification:', notificationError);
      // Don't fail the approval if notification creation fails
    }
    
    res.json({
      success: true,
      message: 'User approved successfully',
      user: user.toJSON()
    });
    
  } catch (error) {
    console.error('User approval error:', error);
    res.status(500).json({
      success: false,
      error: 'User approval failed',
      errorType: 'USER_APPROVAL_ERROR'
    });
  }
});

// Reject user (admin and cashier only)
router.post('/reject-user', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'cashier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Admin or cashier access required',
        errorType: 'ACCESS_DENIED'
      });
    }
    
    const { userId, reason } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isActive: false,
        rejectedAt: new Date(),
        rejectionReason: reason
      },
      { new: true }
    ).select('-password -refreshTokens');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        errorType: 'USER_NOT_FOUND'
      });
    }

    // Create rejection notification for the user
    try {
      await new Notification({
        title: 'Account Registration Rejected',
        message: reason 
          ? `Your account registration has been rejected by ${req.user.fullName || req.user.username}. Reason: ${reason}`
          : `Your account registration has been rejected by ${req.user.fullName || req.user.username}. Please contact support for more information.`,
        category: 'system',
        type: 'error',
        priority: 'high',
        recipient: {
          userId: user._id,
          specific: true
        },
        sender: {
          userId: req.user._id,
          system: false,
          name: req.user.fullName || req.user.username
        },
        data: {
          rejectedBy: req.user._id,
          rejectorName: req.user.fullName || req.user.username,
          rejectedAt: new Date(),
          reason: reason || 'No reason provided'
        }
      }).save();
    } catch (notificationError) {
      console.error('Failed to create rejection notification:', notificationError);
      // Don't fail the rejection if notification creation fails
    }
    
    res.json({
      success: true,
      message: 'User rejected successfully',
      user: user.toJSON()
    });
    
  } catch (error) {
    console.error('User rejection error:', error);
    res.status(500).json({
      success: false,
      error: 'User rejection failed',
      errorType: 'USER_REJECTION_ERROR'
    });
  }
});

module.exports = router;
