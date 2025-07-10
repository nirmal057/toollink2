const express = require('express');
const User = require('../models/User');
const { authenticateToken, authorize, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      isApproved,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isApproved !== undefined) query.isApproved = isApproved === 'true';

    // Search functionality
    if (search) {
      query.$or = [
        { fullName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { username: new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password -refreshTokens')
      .populate('approvedBy', 'fullName username')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      errorType: 'FETCH_USERS_ERROR'
    });
  }
});

// Get user statistics (admin only)
router.get('/stats', authenticateToken, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const approvedUsers = await User.countDocuments({ isApproved: true });
    const pendingUsers = await User.countDocuments({ isApproved: false, isActive: true });

    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const recentUsers = await User.find()
      .select('fullName username email role createdAt isActive isApproved')
      .sort({ createdAt: -1 })
      .limit(10);

    const loginStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalLogins: { $sum: '$loginCount' },
          averageLogins: { $avg: '$loginCount' },
          usersWithRecentLogin: {
            $sum: {
              $cond: [
                { $gte: ['$lastLogin', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        approvedUsers,
        pendingUsers,
        inactiveUsers: totalUsers - activeUsers,
        roleDistribution,
        recentUsers,
        loginStats: loginStats[0] || {
          totalLogins: 0,
          averageLogins: 0,
          usersWithRecentLogin: 0
        }
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics',
      errorType: 'FETCH_STATS_ERROR'
    });
  }
});

// Get single user (admin or self)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user can access this profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        errorType: 'ACCESS_DENIED'
      });
    }

    const user = await User.findById(req.params.id)
      .select('-password -refreshTokens')
      .populate('approvedBy', 'fullName username');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        errorType: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      errorType: 'FETCH_USER_ERROR'
    });
  }
});

// Create new user (admin only)
router.post('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      phone,
      role = 'customer',
      nicNumber,
      address
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, password, and full name are required',
        errorType: 'VALIDATION_ERROR'
      });
    }

    // Validate role
    const validRoles = ['admin', 'user', 'warehouse', 'cashier', 'customer', 'driver', 'editor'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
        errorType: 'INVALID_ROLE'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email or username already exists',
        errorType: 'USER_EXISTS'
      });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password, // Will be hashed by the pre-save middleware
      fullName,
      phone,
      role,
      nicNumber,
      address,
      isActive: true,
      isApproved: ['admin', 'cashier', 'warehouse'].includes(role) ? true : false, // Auto-approve staff
      approvedBy: ['admin', 'cashier', 'warehouse'].includes(role) ? req.user._id : null
    });

    await newUser.save();

    // Return user without password
    const userResponse = await User.findById(newUser._id)
      .select('-password -refreshTokens')
      .populate('approvedBy', 'fullName username');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Create user error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Email or username already exists',
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
      error: 'Failed to create user',
      errorType: 'CREATE_USER_ERROR'
    });
  }
});

// Update user (admin or self with restrictions)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user._id.toString() === req.params.id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        errorType: 'ACCESS_DENIED'
      });
    }

    // Define allowed updates based on role
    let allowedUpdates = [];

    if (isAdmin) {
      allowedUpdates = ['fullName', 'email', 'phone', 'role', 'isActive', 'isApproved', 'address', 'preferences'];
    } else if (isSelf) {
      allowedUpdates = ['fullName', 'phone', 'address', 'preferences'];
    }

    const updates = {};
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

    // Additional validation for admin updates
    if (isAdmin && updates.role) {
      const validRoles = ['admin', 'user', 'warehouse', 'cashier', 'customer', 'driver', 'editor'];
      if (!validRoles.includes(updates.role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role',
          errorType: 'INVALID_ROLE'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens')
      .populate('approvedBy', 'fullName username');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        errorType: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Email or username already exists',
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
      error: 'Failed to update user',
      errorType: 'UPDATE_USER_ERROR'
    });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
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
        errorType: 'CANNOT_DELETE_SELF'
      });
    }

    // Soft delete by deactivating the user
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      errorType: 'DELETE_USER_ERROR'
    });
  }
});

// Bulk user operations (admin only)
router.post('/bulk', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { action, userIds, data } = req.body;

    if (!action || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Action and user IDs are required',
        errorType: 'VALIDATION_ERROR'
      });
    }

    const validActions = ['activate', 'deactivate', 'approve', 'reject', 'updateRole'];

    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        errorType: 'INVALID_ACTION'
      });
    }

    let updateData = {};

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        break;
      case 'deactivate':
        updateData = { isActive: false };
        break;
      case 'approve':
        updateData = {
          isApproved: true,
          emailVerified: true,
          approvedBy: req.user._id,
          approvedAt: new Date()
        };
        break;
      case 'reject':
        updateData = {
          isActive: false,
          rejectedAt: new Date(),
          rejectionReason: data?.reason || 'Bulk rejection'
        };
        break;
      case 'updateRole':
        if (!data?.role) {
          return res.status(400).json({
            success: false,
            error: 'Role is required for updateRole action',
            errorType: 'MISSING_ROLE'
          });
        }
        updateData = { role: data.role };
        break;
    }

    const result = await User.updateMany(
      {
        _id: { $in: userIds },
        _id: { $ne: req.user._id } // Prevent admin from affecting their own account
      },
      updateData
    );

    res.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });

  } catch (error) {
    console.error('Bulk user operation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk operation',
      errorType: 'BULK_OPERATION_ERROR'
    });
  }
});

// Get user activity (admin or self)
router.get('/:id/activity', authenticateToken, async (req, res) => {
  try {
    // Check if user can access this activity
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        errorType: 'ACCESS_DENIED'
      });
    }

    const user = await User.findById(req.params.id)
      .select('fullName username lastLogin loginCount createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        errorType: 'USER_NOT_FOUND'
      });
    }

    // You could expand this to include more detailed activity tracking
    // by creating an Activity model and tracking user actions

    const activity = {
      user: {
        name: user.fullName,
        username: user.username,
        joinedDate: user.createdAt
      },
      loginStats: {
        lastLogin: user.lastLogin,
        totalLogins: user.loginCount,
        averageLoginsPerDay: user.loginCount > 0 ?
          user.loginCount / Math.max(1, Math.floor((Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000))) : 0
      }
    };

    res.json({
      success: true,
      activity
    });

  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user activity',
      errorType: 'FETCH_ACTIVITY_ERROR'
    });
  }
});

// Reset user password (admin only)
router.post('/:id/reset-password', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long',
        errorType: 'VALIDATION_ERROR'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        errorType: 'USER_NOT_FOUND'
      });
    }

    // Update password
    user.password = newPassword;
    user.refreshTokens = []; // Clear all refresh tokens
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      errorType: 'RESET_PASSWORD_ERROR'
    });
  }
});

// Get users by role
router.get('/role/:role', authenticateToken, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ['admin', 'user', 'warehouse', 'cashier', 'customer', 'driver', 'editor'];

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
      isApproved: true
    }).select('fullName username email phone role createdAt')
      .sort({ fullName: 1 });

    res.json({
      success: true,
      users,
      role,
      count: users.length
    });

  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users by role',
      errorType: 'FETCH_USERS_BY_ROLE_ERROR'
    });
  }
});

module.exports = router;
