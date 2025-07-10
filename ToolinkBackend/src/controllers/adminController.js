const User = require('../models/User');
const Order = require('../models/Order');
const Material = require('../models/Material');

class AdminController {
  // Get comprehensive dashboard data
  static async getDashboard(req, res) {
    try {
      console.log('📊 Loading admin dashboard...');

      // Get current date for time-based calculations
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // User statistics
      const [totalUsers, activeUsers, pendingUsers] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ isApproved: true, isActive: true }),
        User.countDocuments({ isApproved: false })
      ]);

      // User roles breakdown
      const userRoles = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      const userRoleStats = {};
      userRoles.forEach(role => {
        userRoleStats[role._id] = role.count;
      });

      // Order and inventory counts
      const [orderCount, materialCount] = await Promise.all([
        Order.countDocuments({}),
        Material.countDocuments({})
      ]);

      const dashboardData = {
        userStats: {
          total: totalUsers,
          active: activeUsers,
          pending: pendingUsers,
          inactive: totalUsers - activeUsers,
          byRole: userRoleStats
        },
        systemInfo: {
          serverTime: now.toISOString(),
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        },
        stats: {
          orders: orderCount,
          materials: materialCount
        }
      };

      res.json({
        success: true,
        dashboard: dashboardData
      });

    } catch (error) {
      console.error('Error loading dashboard:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to load dashboard'
      });
    }
  }

  // Get comprehensive system reports
  static async getSystemReports(req, res) {
    try {
      console.log('📊 Generating system reports...');

      // Get current date for time-based calculations
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // User statistics
      const [totalUsers, activeUsers, newUsersThisMonth, newUsersLastMonth] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ isApproved: true }),
        User.countDocuments({ createdAt: { $gte: startOfMonth } }),
        User.countDocuments({ 
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
        })
      ]);

      const userGrowth = newUsersLastMonth > 0 
        ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100)
        : (newUsersThisMonth > 0 ? 100 : 0);

      // User roles breakdown
      const userRoles = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      // Order statistics
      const [totalOrders, ordersThisMonth, ordersLastMonth, pendingOrders] = await Promise.all([
        Order.countDocuments({}),
        Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Order.countDocuments({ 
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
        }),
        Order.countDocuments({ status: 'pending' })
      ]);

      const orderGrowth = ordersLastMonth > 0 
        ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth * 100)
        : (ordersThisMonth > 0 ? 100 : 0);

      // Order status breakdown
      const orderStatuses = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      // Revenue calculations (if orders have total amounts)
      const revenueData = await Order.aggregate([
        {
          $match: {
            status: { $in: ['delivered', 'completed'] },
            totalAmount: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            averageOrderValue: { $avg: '$totalAmount' }
          }
        }
      ]);

      const revenue = revenueData[0] || { totalRevenue: 0, averageOrderValue: 0 };

      // Inventory statistics
      const [totalItems, lowStockItems, outOfStockItems, activeItems] = await Promise.all([
        Material.countDocuments({}),
        Material.countDocuments({
          $expr: { $lte: ['$stock.currentQuantity', '$stock.minimumQuantity'] }
        }),
        Material.countDocuments({ 'stock.currentQuantity': 0 }),
        Material.countDocuments({ isActive: true })
      ]);

      // Inventory categories
      const inventoryCategories = await Material.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);

      // Recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivity = {
        newUsers: await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        newOrders: await Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        newItems: await Material.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
      };

      // Compile the comprehensive report
      const reports = {
        userStats: {
          total: totalUsers,
          active: activeUsers,
          newThisMonth: newUsersThisMonth,
          growth: Math.round(userGrowth * 100) / 100,
          byRole: userRoles.reduce((acc, role) => {
            acc[role._id] = role.count;
            return acc;
          }, {})
        },
        orderStats: {
          total: totalOrders,
          thisMonth: ordersThisMonth,
          pending: pendingOrders,
          growth: Math.round(orderGrowth * 100) / 100,
          byStatus: orderStatuses.reduce((acc, status) => {
            acc[status._id] = status.count;
            return acc;
          }, {})
        },
        inventoryStats: {
          total: totalItems,
          active: activeItems,
          lowStock: lowStockItems,
          outOfStock: outOfStockItems,
          byCategory: inventoryCategories.reduce((acc, category) => {
            acc[category._id] = category.count;
            return acc;
          }, {})
        },
        revenueStats: {
          total: revenue.totalRevenue,
          average: Math.round(revenue.averageOrderValue * 100) / 100,
          currency: 'LKR'
        },
        recentActivity,
        generatedAt: new Date().toISOString()
      };

      console.log('✅ System reports generated successfully');
      
      res.json({
        success: true,
        reports,
        message: 'System reports generated successfully'
      });

    } catch (error) {
      console.error('❌ Error generating system reports:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate system reports'
      });
    }
  }

  // Get all users (admin function)
  static async getAllUsers(req, res) {
    try {
      const users = await User.find({})
        .select('-password')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        users,
        total: users.length
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch users'
      });
    }
  }

  // Update user status
  static async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { isApproved, isActive } = req.body;

      const user = await User.findByIdAndUpdate(
        id,
        { 
          ...(isApproved !== undefined && { isApproved }),
          ...(isActive !== undefined && { isActive })
        },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        user,
        message: 'User status updated successfully'
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update user status'
      });
    }
  }

  // Delete user (admin function)
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete user'
      });
    }
  }

  // Get basic system stats
  static async getSystemStats(req, res) {
    try {
      const [userCount, orderCount, itemCount] = await Promise.all([
        User.countDocuments({}),
        Order.countDocuments({}),
        Material.countDocuments({})
      ]);

      res.json({
        success: true,
        stats: {
          users: userCount,
          orders: orderCount,
          items: itemCount,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch system stats'
      });
    }
  }
}

module.exports = AdminController;
