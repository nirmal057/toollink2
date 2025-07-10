const Order = require('../models/Order');
const SubOrder = require('../models/SubOrder');
const Material = require('../models/Material');
const Warehouse = require('../models/Warehouse');
const mongoose = require('mongoose');

class OrderController {
  // Create a new order
  static async createOrder(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderData = req.body;
      
      // Validate required fields
      if (!orderData.customer || !orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Customer information and items are required'
        });
      }

      // Calculate pricing
      let subtotal = 0;
      const processedItems = [];

      for (const item of orderData.items) {
        const material = await Material.findById(item.materialId).session(session);
        if (!material) {
          throw new Error(`Material not found: ${item.materialId}`);
        }

        const unitPrice = item.unitPrice || material.pricing.sellingPrice;
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        processedItems.push({
          ...item,
          materialName: material.name,
          materialSku: material.sku,
          unitPrice,
          totalPrice,
          unit: material.unit
        });
      }

      // Calculate total with taxes and charges
      const tax = orderData.pricing?.tax || 0;
      const deliveryCharges = orderData.pricing?.deliveryCharges || 0;
      const discount = orderData.pricing?.discount || 0;
      const total = subtotal + tax + deliveryCharges - discount;

      // Create order
      const order = new Order({
        ...orderData,
        items: processedItems,
        pricing: {
          subtotal,
          tax,
          deliveryCharges,
          discount,
          total,
          currency: orderData.pricing?.currency || 'LKR'
        },
        paymentInfo: {
          ...orderData.paymentInfo,
          dueAmount: total - (orderData.paymentInfo?.paidAmount || 0)
        }
      });

      await order.save({ session });

      // Auto-split into sub-orders by warehouse/material availability
      await OrderController.splitOrderIntoSubOrders(order._id, session);

      await session.commitTransaction();

      // Fetch the complete order with sub-orders
      const createdOrder = await Order.findById(order._id)
        .populate('subOrders')
        .populate('customer.customerId', 'name email phone')
        .populate('items.materialId', 'name sku category');

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: createdOrder
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create order'
      });
    } finally {
      session.endSession();
    }
  }

  // Split order into sub-orders based on warehouse availability
  static async splitOrderIntoSubOrders(orderId, session) {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error('Order not found');

    // Group items by warehouse based on material availability
    const warehouseGroups = {};
    
    for (const item of order.items) {
      // Find warehouses that have this material
      const warehouses = await Warehouse.find({
        'inventory.materialId': item.materialId,
        'inventory.quantity': { $gte: item.quantity }
      }).session(session);

      if (warehouses.length === 0) {
        // If no warehouse has enough quantity, assign to the one with the most stock
        const warehouseWithStock = await Warehouse.findOne({
          'inventory.materialId': item.materialId
        }).session(session);
        
        if (warehouseWithStock) {
          const warehouseId = warehouseWithStock._id.toString();
          if (!warehouseGroups[warehouseId]) {
            warehouseGroups[warehouseId] = {
              warehouse: warehouseWithStock,
              items: []
            };
          }
          warehouseGroups[warehouseId].items.push(item);
        }
      } else {
        // Use the first available warehouse (you can implement more sophisticated logic)
        const selectedWarehouse = warehouses[0];
        const warehouseId = selectedWarehouse._id.toString();
        
        if (!warehouseGroups[warehouseId]) {
          warehouseGroups[warehouseId] = {
            warehouse: selectedWarehouse,
            items: []
          };
        }
        warehouseGroups[warehouseId].items.push(item);
      }
    }

    // Create sub-orders for each warehouse group
    for (const [warehouseId, group] of Object.entries(warehouseGroups)) {
      const subOrderSubtotal = group.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const subOrderTax = (subOrderSubtotal / order.pricing.subtotal) * order.pricing.tax;
      const subOrderDeliveryCharges = (subOrderSubtotal / order.pricing.subtotal) * order.pricing.deliveryCharges;
      const subOrderTotal = subOrderSubtotal + subOrderTax + subOrderDeliveryCharges;

      const subOrder = new SubOrder({
        parentOrderId: order._id,
        parentOrderNumber: order.orderNumber,
        warehouse: {
          warehouseId: group.warehouse._id,
          warehouseName: group.warehouse.name,
          warehouseLocation: group.warehouse.location.address
        },
        items: group.items.map(item => ({
          ...item,
          availableQuantity: 0, // Will be updated when checking inventory
          allocatedQuantity: 0
        })),
        pricing: {
          subtotal: subOrderSubtotal,
          tax: subOrderTax,
          deliveryCharges: subOrderDeliveryCharges,
          total: subOrderTotal
        },
        priority: order.priority,
        status: 'pending'
      });

      await subOrder.save({ session });
    }
  }

  // Get all orders with pagination and filtering
  static async getOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        customerId,
        startDate,
        endDate,
        priority,
        search
      } = req.query;

      const filter = {};
      
      if (status) filter.status = status;
      if (customerId) filter['customer.customerId'] = customerId;
      if (priority) filter.priority = priority;
      
      if (startDate || endDate) {
        filter['timeline.orderDate'] = {};
        if (startDate) filter['timeline.orderDate'].$gte = new Date(startDate);
        if (endDate) filter['timeline.orderDate'].$lte = new Date(endDate);
      }

      if (search) {
        filter.$or = [
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'customer.name': { $regex: search, $options: 'i' } },
          { 'customer.email': { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const orders = await Order.find(filter)
        .populate('subOrders')
        .populate('customer.customerId', 'name email phone')
        .populate('items.materialId', 'name sku category')
        .populate('assignedStaff.salesPerson', 'name email')
        .populate('assignedStaff.warehouseManager', 'name email')
        .sort({ 'timeline.orderDate': -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Order.countDocuments(filter);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: orders.length,
            totalRecords: total
          }
        }
      });

    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders'
      });
    }
  }

  // Get order by ID with sub-orders
  static async getOrderById(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findById(id)
        .populate('subOrders')
        .populate('customer.customerId', 'name email phone')
        .populate('items.materialId', 'name sku category pricing')
        .populate('assignedStaff.salesPerson', 'name email')
        .populate('assignedStaff.warehouseManager', 'name email');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order
      });

    } catch (error) {
      console.error('Get order by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order'
      });
    }
  }

  // Update order status
  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const updateData = { status };
      
      // Update timeline based on status
      switch (status) {
        case 'confirmed':
          updateData['timeline.confirmedAt'] = new Date();
          break;
        case 'fully_scheduled':
          updateData['timeline.scheduledAt'] = new Date();
          break;
        case 'fully_dispatched':
          updateData['timeline.dispatchedAt'] = new Date();
          break;
        case 'completed':
          updateData['timeline.deliveredAt'] = new Date();
          break;
        case 'cancelled':
          updateData['timeline.cancelledAt'] = new Date();
          break;
      }

      if (notes) {
        updateData['notes.internalNotes'] = notes;
      }

      const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true })
        .populate('subOrders')
        .populate('customer.customerId', 'name email phone');

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: updatedOrder
      });

    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order status'
      });
    }
  }

  // Get sub-orders for an order
  static async getSubOrders(req, res) {
    try {
      const { orderId } = req.params;

      const subOrders = await SubOrder.find({ parentOrderId: orderId })
        .populate('warehouse.warehouseId', 'name location contact')
        .populate('items.materialId', 'name sku category')
        .populate('assignedStaff.warehouseStaff', 'name email')
        .populate('assignedStaff.picker', 'name email')
        .populate('assignedStaff.dispatcher', 'name email')
        .sort({ 'timeline.createdAt': 1 });

      res.json({
        success: true,
        data: subOrders
      });

    } catch (error) {
      console.error('Get sub-orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sub-orders'
      });
    }
  }

  // Update sub-order status
  static async updateSubOrderStatus(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;
      const { status, notes, assignedStaff } = req.body;

      const subOrder = await SubOrder.findById(id).session(session);
      if (!subOrder) {
        return res.status(404).json({
          success: false,
          message: 'Sub-order not found'
        });
      }

      const updateData = { status };
      
      // Update timeline based on status
      switch (status) {
        case 'confirmed':
          updateData['timeline.confirmedAt'] = new Date();
          break;
        case 'allocated':
          updateData['timeline.allocatedAt'] = new Date();
          break;
        case 'packed':
          updateData['timeline.packedAt'] = new Date();
          break;
        case 'dispatched':
          updateData['timeline.dispatchedAt'] = new Date();
          break;
        case 'delivered':
          updateData['timeline.deliveredAt'] = new Date();
          break;
        case 'cancelled':
          updateData['timeline.cancelledAt'] = new Date();
          break;
      }

      if (notes) {
        updateData['notes.internalNotes'] = notes;
      }

      if (assignedStaff) {
        updateData.assignedStaff = { ...subOrder.assignedStaff, ...assignedStaff };
      }

      const updatedSubOrder = await SubOrder.findByIdAndUpdate(id, updateData, { 
        new: true, 
        session 
      }).populate('warehouse.warehouseId', 'name location');

      // Update parent order status based on sub-order statuses
      await OrderController.updateParentOrderStatus(subOrder.parentOrderId, session);

      await session.commitTransaction();

      res.json({
        success: true,
        message: 'Sub-order status updated successfully',
        data: updatedSubOrder
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Update sub-order status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update sub-order status'
      });
    } finally {
      session.endSession();
    }
  }

  // Update parent order status based on sub-order statuses
  static async updateParentOrderStatus(parentOrderId, session) {
    const subOrders = await SubOrder.find({ parentOrderId }).session(session);
    if (subOrders.length === 0) return;

    const allDelivered = subOrders.every(sub => sub.status === 'delivered');
    const allDispatched = subOrders.every(sub => ['dispatched', 'in_transit', 'delivered'].includes(sub.status));
    const someDispatched = subOrders.some(sub => ['dispatched', 'in_transit', 'delivered'].includes(sub.status));
    const allScheduled = subOrders.every(sub => sub.status !== 'pending');
    const someScheduled = subOrders.some(sub => sub.status !== 'pending');

    let newStatus;
    if (allDelivered) {
      newStatus = 'completed';
    } else if (allDispatched) {
      newStatus = 'fully_dispatched';
    } else if (someDispatched) {
      newStatus = 'partially_dispatched';
    } else if (allScheduled) {
      newStatus = 'fully_scheduled';
    } else if (someScheduled) {
      newStatus = 'partially_scheduled';
    } else {
      newStatus = 'processing';
    }

    await Order.findByIdAndUpdate(parentOrderId, { status: newStatus }, { session });
  }

  // Get order statistics
  static async getOrderStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const matchStage = {};
      if (startDate || endDate) {
        matchStage['timeline.orderDate'] = {};
        if (startDate) matchStage['timeline.orderDate'].$gte = new Date(startDate);
        if (endDate) matchStage['timeline.orderDate'].$lte = new Date(endDate);
      }

      const stats = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalValue: { $sum: '$pricing.total' },
            avgOrderValue: { $avg: '$pricing.total' },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        }
      ]);

      const statusBreakdown = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$pricing.total' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          overview: stats[0] || {
            totalOrders: 0,
            totalValue: 0,
            avgOrderValue: 0,
            pendingOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0
          },
          statusBreakdown
        }
      });

    } catch (error) {
      console.error('Get order stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order statistics'
      });
    }
  }

  // Search orders
  static async searchOrders(req, res) {
    try {
      const { q, limit = 10 } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const searchFilter = {
        $or: [
          { orderNumber: { $regex: q, $options: 'i' } },
          { 'customer.name': { $regex: q, $options: 'i' } },
          { 'customer.email': { $regex: q, $options: 'i' } },
          { 'customer.phone': { $regex: q, $options: 'i' } }
        ]
      };

      const orders = await Order.find(searchFilter)
        .populate('customer.customerId', 'name email phone')
        .select('orderNumber customer status pricing timeline')
        .limit(parseInt(limit))
        .sort({ 'timeline.orderDate': -1 });

      res.json({
        success: true,
        data: orders
      });

    } catch (error) {
      console.error('Search orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search orders'
      });
    }
  }
}

module.exports = OrderController;
