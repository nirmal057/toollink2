const express = require('express');
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all deliveries (with filters and pagination)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      driverId,
      customerId,
      date,
      priority,
      sortBy = 'scheduledDate',
      sortOrder = 'asc',
      search
    } = req.query;
    
    // Build query based on user role
    let query = {};
    
    // Customers can only see their own deliveries
    if (req.user.role === 'customer') {
      query.customerId = req.user._id;
    }
    
    // Drivers can see their assigned deliveries
    if (req.user.role === 'driver') {
      query.driverId = req.user._id;
    }
    
    // Apply filters
    if (status) query.status = status;
    if (driverId && req.user.role !== 'customer' && req.user.role !== 'driver') {
      query.driverId = driverId;
    }
    if (customerId && req.user.role !== 'customer') query.customerId = customerId;
    if (priority) query.priority = priority;
    
    // Date filter
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { deliveryNumber: new RegExp(search, 'i') },
        { 'deliveryLocation.address.street': new RegExp(search, 'i') },
        { 'deliveryLocation.address.city': new RegExp(search, 'i') },
        { 'deliveryLocation.contactPerson': new RegExp(search, 'i') }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const deliveries = await Delivery.find(query)
      .populate('orderId', 'orderNumber customer finalAmount')
      .populate('customerId', 'fullName email phone')
      .populate('driverId', 'fullName username phone')
      .populate('createdBy', 'fullName username')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalDeliveries = await Delivery.countDocuments(query);
    const totalPages = Math.ceil(totalDeliveries / parseInt(limit));
    
    res.json({
      success: true,
      deliveries,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalDeliveries,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deliveries',
      errorType: 'FETCH_DELIVERIES_ERROR'
    });
  }
});

// Get delivery statistics
router.get('/stats', authenticateToken, authorize('admin', 'warehouse', 'cashier'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const totalDeliveries = await Delivery.countDocuments(dateQuery);
    const deliveredCount = await Delivery.countDocuments({
      ...dateQuery,
      status: 'Delivered'
    });
    const pendingCount = await Delivery.countDocuments({
      ...dateQuery,
      status: { $in: ['Scheduled', 'In Transit'] }
    });
    const failedCount = await Delivery.countDocuments({
      ...dateQuery,
      status: 'Failed'
    });
    
    const statusDistribution = await Delivery.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const overdueDeliveries = await Delivery.findOverdue();
    
    const averageDeliveryTime = await Delivery.aggregate([
      {
        $match: {
          ...dateQuery,
          status: 'Delivered',
          actualStartTime: { $exists: true },
          actualEndTime: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgDuration: {
            $avg: {
              $divide: [
                { $subtract: ['$actualEndTime', '$actualStartTime'] },
                1000 * 60 // Convert to minutes
              ]
            }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalDeliveries,
        deliveredCount,
        pendingCount,
        failedCount,
        overdueCount: overdueDeliveries.length,
        successRate: totalDeliveries > 0 ? ((deliveredCount / totalDeliveries) * 100).toFixed(2) : 0,
        statusDistribution,
        averageDeliveryTime: averageDeliveryTime[0]?.avgDuration || 0
      }
    });
    
  } catch (error) {
    console.error('Get delivery stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery statistics',
      errorType: 'FETCH_STATS_ERROR'
    });
  }
});

// Get deliveries for current user (customer or driver)
router.get('/my-deliveries', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let query = {};
    
    if (req.user.role === 'customer') {
      query.customerId = req.user._id;
    } else if (req.user.role === 'driver') {
      query.driverId = req.user._id;
    } else {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        errorType: 'ACCESS_DENIED'
      });
    }
    
    if (status) query.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const deliveries = await Delivery.find(query)
      .populate('orderId', 'orderNumber customer finalAmount items')
      .populate('customerId', 'fullName email phone')
      .populate('driverId', 'fullName username phone')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalDeliveries = await Delivery.countDocuments(query);
    
    res.json({
      success: true,
      deliveries,
      totalDeliveries,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalDeliveries / parseInt(limit))
    });
    
  } catch (error) {
    console.error('Get my deliveries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your deliveries',
      errorType: 'FETCH_MY_DELIVERIES_ERROR'
    });
  }
});

// Get single delivery
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('orderId')
      .populate('customerId', 'fullName email phone address')
      .populate('driverId', 'fullName username phone')
      .populate('createdBy', 'fullName username')
      .populate('updatedBy', 'fullName username')
      .populate('tracking.updatedBy', 'fullName username');
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found',
        errorType: 'DELIVERY_NOT_FOUND'
      });
    }
    
    // Check permissions
    const canView = req.user.role === 'admin' ||
                   req.user.role === 'warehouse' ||
                   req.user.role === 'cashier' ||
                   (req.user.role === 'customer' && delivery.customerId._id.toString() === req.user._id.toString()) ||
                   (req.user.role === 'driver' && delivery.driverId?._id.toString() === req.user._id.toString());
    
    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        errorType: 'ACCESS_DENIED'
      });
    }
    
    res.json({
      success: true,
      delivery
    });
    
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery',
      errorType: 'FETCH_DELIVERY_ERROR'
    });
  }
});

// Create new delivery
router.post('/', authenticateToken, authorize('admin', 'warehouse', 'cashier'), async (req, res) => {
  try {
    const {
      orderId,
      driverId,
      scheduledDate,
      scheduledTimeSlot,
      priority = 'Normal',
      pickupLocation,
      deliveryLocation,
      items,
      specialRequirements,
      estimatedDuration
    } = req.body;
    
    // Validation
    if (!orderId || !scheduledDate || !scheduledTimeSlot) {
      return res.status(400).json({
        success: false,
        error: 'Order ID, scheduled date, and time slot are required',
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    // Verify order exists
    const order = await Order.findById(orderId).populate('customerId');
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        errorType: 'ORDER_NOT_FOUND'
      });
    }
    
    // Check if delivery already exists for this order
    const existingDelivery = await Delivery.findOne({ orderId });
    if (existingDelivery) {
      return res.status(409).json({
        success: false,
        error: 'Delivery already exists for this order',
        errorType: 'DELIVERY_EXISTS'
      });
    }
    
    const deliveryData = {
      orderId,
      customerId: order.customerId._id,
      driverId,
      scheduledDate: new Date(scheduledDate),
      scheduledTimeSlot,
      priority,
      pickupLocation: pickupLocation || {
        name: 'Main Warehouse',
        address: {
          street: '123 Warehouse St',
          city: 'Business City',
          state: 'BC',
          zipCode: '12345'
        }
      },
      deliveryLocation: deliveryLocation || {
        name: order.customer,
        address: order.address,
        contactPerson: order.customer,
        contactPhone: order.contact
      },
      items: items || order.items.map(item => ({
        name: item.name,
        quantity: item.quantity
      })),
      specialRequirements: specialRequirements || {},
      estimatedDuration,
      createdBy: req.user._id
    };
    
    const delivery = new Delivery(deliveryData);
    await delivery.save();
    
    // Populate the created delivery
    const populatedDelivery = await Delivery.findById(delivery._id)
      .populate('orderId', 'orderNumber customer finalAmount')
      .populate('customerId', 'fullName email phone')
      .populate('driverId', 'fullName username phone')
      .populate('createdBy', 'fullName username');
    
    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      delivery: populatedDelivery
    });
    
  } catch (error) {
    console.error('Create delivery error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map(e => e.message).join(', '),
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create delivery',
      errorType: 'CREATE_DELIVERY_ERROR'
    });
  }
});

// Update delivery status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, location, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    const validStatuses = ['Scheduled', 'In Transit', 'Delivered', 'Failed', 'Cancelled', 'Rescheduled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        errorType: 'INVALID_STATUS'
      });
    }
    
    const delivery = await Delivery.findById(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found',
        errorType: 'DELIVERY_NOT_FOUND'
      });
    }
    
    // Check permissions
    const canUpdate = req.user.role === 'admin' ||
                     req.user.role === 'warehouse' ||
                     req.user.role === 'cashier' ||
                     (req.user.role === 'driver' && delivery.driverId?.toString() === req.user._id.toString());
    
    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        errorType: 'ACCESS_DENIED'
      });
    }
    
    await delivery.updateStatus(status, req.user._id, location, notes);
    
    const updatedDelivery = await Delivery.findById(delivery._id)
      .populate('orderId', 'orderNumber customer')
      .populate('customerId', 'fullName email phone')
      .populate('driverId', 'fullName username phone');
    
    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      delivery: updatedDelivery
    });
    
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update delivery status',
      errorType: 'UPDATE_STATUS_ERROR'
    });
  }
});

// Mark delivery as delivered
router.patch('/:id/delivered', authenticateToken, async (req, res) => {
  try {
    const { receivedBy, signature, photos, notes, rating } = req.body;
    
    if (!receivedBy) {
      return res.status(400).json({
        success: false,
        error: 'Received by is required',
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    const delivery = await Delivery.findById(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found',
        errorType: 'DELIVERY_NOT_FOUND'
      });
    }
    
    // Check permissions - only driver or admin can mark as delivered
    const canDeliver = req.user.role === 'admin' ||
                      (req.user.role === 'driver' && delivery.driverId?.toString() === req.user._id.toString());
    
    if (!canDeliver) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        errorType: 'ACCESS_DENIED'
      });
    }
    
    await delivery.markAsDelivered(receivedBy, signature, photos, notes, rating);
    
    // Update related order status
    if (delivery.orderId) {
      const order = await Order.findById(delivery.orderId);
      if (order && order.status !== 'Delivered') {
        await order.updateStatus('Delivered', req.user._id, 'Delivery completed', 'Order delivered successfully');
      }
    }
    
    const updatedDelivery = await Delivery.findById(delivery._id)
      .populate('orderId', 'orderNumber customer')
      .populate('customerId', 'fullName email phone')
      .populate('driverId', 'fullName username phone');
    
    res.json({
      success: true,
      message: 'Delivery marked as delivered successfully',
      delivery: updatedDelivery
    });
    
  } catch (error) {
    console.error('Mark delivery as delivered error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark delivery as delivered',
      errorType: 'MARK_DELIVERED_ERROR'
    });
  }
});

// Reschedule delivery
router.patch('/:id/reschedule', authenticateToken, authorize('admin', 'warehouse', 'cashier', 'driver'), async (req, res) => {
  try {
    const { newDate, reason } = req.body;
    
    if (!newDate || !reason) {
      return res.status(400).json({
        success: false,
        error: 'New date and reason are required',
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    const delivery = await Delivery.findById(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found',
        errorType: 'DELIVERY_NOT_FOUND'
      });
    }
    
    await delivery.reschedule(new Date(newDate), reason, req.user._id);
    
    const updatedDelivery = await Delivery.findById(delivery._id)
      .populate('orderId', 'orderNumber customer')
      .populate('customerId', 'fullName email phone')
      .populate('driverId', 'fullName username phone');
    
    res.json({
      success: true,
      message: 'Delivery rescheduled successfully',
      delivery: updatedDelivery
    });
    
  } catch (error) {
    console.error('Reschedule delivery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reschedule delivery',
      errorType: 'RESCHEDULE_ERROR'
    });
  }
});

// Assign driver to delivery
router.patch('/:id/assign-driver', authenticateToken, authorize('admin', 'warehouse', 'cashier'), async (req, res) => {
  try {
    const { driverId } = req.body;
    
    if (!driverId) {
      return res.status(400).json({
        success: false,
        error: 'Driver ID is required',
        errorType: 'VALIDATION_ERROR'
      });
    }
    
    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { 
        driverId,
        updatedBy: req.user._id
      },
      { new: true }
    ).populate('orderId', 'orderNumber customer')
     .populate('customerId', 'fullName email phone')
     .populate('driverId', 'fullName username phone');
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found',
        errorType: 'DELIVERY_NOT_FOUND'
      });
    }
    
    // Add tracking entry
    delivery.tracking.push({
      status: delivery.status,
      timestamp: new Date(),
      notes: `Driver assigned: ${delivery.driverId.fullName}`,
      updatedBy: req.user._id
    });
    
    await delivery.save();
    
    res.json({
      success: true,
      message: 'Driver assigned successfully',
      delivery
    });
    
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign driver',
      errorType: 'ASSIGN_DRIVER_ERROR'
    });
  }
});

// Get overdue deliveries
router.get('/status/overdue', authenticateToken, authorize('admin', 'warehouse', 'cashier'), async (req, res) => {
  try {
    const overdueDeliveries = await Delivery.findOverdue()
      .populate('orderId', 'orderNumber customer')
      .populate('customerId', 'fullName email phone')
      .populate('driverId', 'fullName username phone')
      .sort({ scheduledDate: 1 });
    
    res.json({
      success: true,
      deliveries: overdueDeliveries,
      count: overdueDeliveries.length
    });
    
  } catch (error) {
    console.error('Get overdue deliveries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue deliveries',
      errorType: 'FETCH_OVERDUE_ERROR'
    });
  }
});

// Get deliveries by driver and date
router.get('/driver/:driverId', authenticateToken, authorize('admin', 'warehouse', 'cashier', 'driver'), async (req, res) => {
  try {
    const { driverId } = req.params;
    const { date } = req.query;
    
    // Drivers can only see their own deliveries
    if (req.user.role === 'driver' && req.user._id.toString() !== driverId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        errorType: 'ACCESS_DENIED'
      });
    }
    
    const deliveries = await Delivery.findByDriver(driverId, date ? new Date(date) : null);
    
    res.json({
      success: true,
      deliveries,
      driverId,
      date: date || 'all dates'
    });
    
  } catch (error) {
    console.error('Get deliveries by driver error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deliveries by driver',
      errorType: 'FETCH_BY_DRIVER_ERROR'
    });
  }
});

module.exports = router;
