import express from 'express';
import { body, validationResult } from 'express-validator';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';
import User from '../models/User.js';
import { authorize, authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Apply authentication to all order routes
router.use(authenticateToken);

// Get all orders
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            customer,
            startDate,
            endDate,
            search = '',
            sort = '-createdAt'
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            status,
            customer,
            startDate,
            endDate,
            sort
        };

        // Role-based filtering
        if (req.user.role === 'customer') {
            options.customer = req.user._id;
        }

        const result = await Order.searchOrders(search, options);

        res.json({
            success: true,
            data: result.orders,
            pagination: {
                page: result.page,
                pages: result.pages,
                total: result.total,
                hasNextPage: result.hasNextPage,
                hasPrevPage: result.hasPrevPage
            }
        });
    } catch (error) {
        logger.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
            errorType: 'FETCH_ORDERS_ERROR'
        });
    }
});

// Get order statistics
router.get('/stats', authorize('admin', 'cashier', 'warehouse'), async (req, res) => {
    try {
        const stats = await Order.getStatistics();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Get order statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order statistics',
            errorType: 'FETCH_STATS_ERROR'
        });
    }
});

// Get my orders (customer only)
router.get('/my-orders', async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            status
        };

        const result = await Order.getOrdersByCustomer(req.user._id, options);

        res.json({
            success: true,
            data: result.orders,
            pagination: {
                page: result.page,
                pages: result.pages,
                total: result.total,
                hasNextPage: result.hasNextPage,
                hasPrevPage: result.hasPrevPage
            }
        });
    } catch (error) {
        logger.error('Get my orders error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch your orders',
            errorType: 'FETCH_MY_ORDERS_ERROR'
        });
    }
});

// Get single order
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'fullName email phone')
            .populate('items.inventory', 'name sku unit category')
            .populate('delivery.driver', 'fullName phone email')
            .populate('approvedBy', 'fullName email')
            .populate('processedBy', 'fullName email')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email');

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
                errorType: 'ORDER_NOT_FOUND'
            });
        }

        // Check if user can access this order
        if (req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                errorType: 'ACCESS_DENIED'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        logger.error('Get order error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order',
            errorType: 'FETCH_ORDER_ERROR'
        });
    }
});

// Create order
router.post('/', [
    body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
    body('items.*.inventory').isMongoId().withMessage('Invalid inventory ID'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
    body('shippingAddress.city').notEmpty().withMessage('City is required'),
    body('shippingAddress.zipCode').notEmpty().withMessage('Zip code is required')
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

        const { items, shippingAddress, billingAddress, delivery, notes } = req.body;

        // Calculate order totals
        let totalAmount = 0;
        const processedItems = [];

        for (const item of items) {
            const inventory = await Inventory.findById(item.inventory);

            if (!inventory || inventory.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    error: `Item ${inventory ? inventory.name : 'unknown'} is not available`,
                    errorType: 'ITEM_NOT_AVAILABLE'
                });
            }

            if (inventory.current_stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    error: `Insufficient stock for ${inventory.name}. Available: ${inventory.current_stock}`,
                    errorType: 'INSUFFICIENT_STOCK'
                });
            }

            const unitPrice = inventory.selling_price || inventory.cost || 0;
            const totalPrice = unitPrice * item.quantity;

            processedItems.push({
                inventory: inventory._id,
                quantity: item.quantity,
                unitPrice,
                totalPrice,
                notes: item.notes
            });

            totalAmount += totalPrice;
        }

        // Create order
        const order = new Order({
            customer: req.user._id,
            items: processedItems,
            totalAmount,
            finalAmount: totalAmount,
            shippingAddress,
            billingAddress: billingAddress || shippingAddress,
            delivery,
            notes,
            createdBy: req.user._id
        });

        await order.save();

        // Update inventory stock
        for (const item of processedItems) {
            await Inventory.findByIdAndUpdate(
                item.inventory,
                { $inc: { current_stock: -item.quantity, quantity: -item.quantity } }
            );
        }

        // Populate order details
        await order.populate('customer', 'fullName email phone');
        await order.populate('items.inventory', 'name sku unit category');

        logger.info(`Order created: ${order.orderNumber} by ${req.user.fullName}`);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        logger.error('Create order error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order',
            errorType: 'CREATE_ORDER_ERROR'
        });
    }
});

// Update order
router.put('/:id', authorize('admin', 'cashier', 'warehouse'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
                errorType: 'ORDER_NOT_FOUND'
            });
        }

        // Update allowed fields
        const allowedFields = [
            'status', 'priority', 'shippingAddress', 'billingAddress',
            'delivery', 'notes', 'internalNotes'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                order[field] = req.body[field];
            }
        });

        order.updatedBy = req.user._id;

        // Handle status changes
        if (req.body.status) {
            switch (req.body.status) {
                case 'confirmed':
                    order.approvedBy = req.user._id;
                    order.approvedAt = new Date();
                    break;
                case 'processing':
                    order.processedBy = req.user._id;
                    order.processedAt = new Date();
                    break;
            }
        }

        await order.save();

        // Populate order details
        await order.populate('customer', 'fullName email phone');
        await order.populate('items.inventory', 'name sku unit category');
        await order.populate('delivery.driver', 'fullName phone');

        logger.info(`Order updated: ${order.orderNumber} by ${req.user.fullName}`);

        res.json({
            success: true,
            message: 'Order updated successfully',
            data: order
        });
    } catch (error) {
        logger.error('Update order error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update order',
            errorType: 'UPDATE_ORDER_ERROR'
        });
    }
});

// Update order status
router.patch('/:id/status', authorize('admin', 'cashier', 'warehouse'), async (req, res) => {
    try {
        const { status, notes } = req.body;

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status',
                errorType: 'INVALID_STATUS'
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
                errorType: 'ORDER_NOT_FOUND'
            });
        }

        const previousStatus = order.status;
        order.status = status;
        order.updatedBy = req.user._id;

        if (notes) {
            order.notes = notes;
        }

        // Handle status-specific actions
        switch (status) {
            case 'confirmed':
                order.approvedBy = req.user._id;
                order.approvedAt = new Date();
                break;
            case 'processing':
                order.processedBy = req.user._id;
                order.processedAt = new Date();
                break;
            case 'delivered':
                if (order.delivery) {
                    order.delivery.actualDate = new Date();
                }
                break;
            case 'cancelled':
                // Restore inventory stock
                for (const item of order.items) {
                    await Inventory.findByIdAndUpdate(
                        item.inventory,
                        { $inc: { current_stock: item.quantity, quantity: item.quantity } }
                    );
                }
                break;
        }

        await order.save();

        logger.info(`Order status updated: ${order.orderNumber} from ${previousStatus} to ${status} by ${req.user.fullName}`);

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: {
                id: order._id,
                orderNumber: order.orderNumber,
                previousStatus,
                currentStatus: status,
                updatedBy: req.user.fullName,
                updatedAt: order.updatedAt
            }
        });
    } catch (error) {
        logger.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update order status',
            errorType: 'UPDATE_STATUS_ERROR'
        });
    }
});

// Delete order (soft delete)
router.delete('/:id', authorize('admin', 'cashier'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
                errorType: 'ORDER_NOT_FOUND'
            });
        }

        // Only allow deletion of pending orders
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Only pending orders can be deleted',
                errorType: 'INVALID_ORDER_STATUS'
            });
        }

        // Restore inventory stock
        for (const item of order.items) {
            await Inventory.findByIdAndUpdate(
                item.inventory,
                { $inc: { current_stock: item.quantity, quantity: item.quantity } }
            );
        }

        // Soft delete
        order.deletedAt = new Date();
        order.updatedBy = req.user._id;
        await order.save();

        logger.info(`Order deleted: ${order.orderNumber} by ${req.user.fullName}`);

        res.json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        logger.error('Delete order error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete order',
            errorType: 'DELETE_ORDER_ERROR'
        });
    }
});

// Get orders by customer
router.get('/customer/:customerId', authorize('admin', 'cashier'), async (req, res) => {
    try {
        const { customerId } = req.params;
        const { page = 1, limit = 10, status } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            status
        };

        const result = await Order.getOrdersByCustomer(customerId, options);

        res.json({
            success: true,
            data: result.orders,
            pagination: {
                page: result.page,
                pages: result.pages,
                total: result.total,
                hasNextPage: result.hasNextPage,
                hasPrevPage: result.hasPrevPage
            }
        });
    } catch (error) {
        logger.error('Get orders by customer error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customer orders',
            errorType: 'FETCH_CUSTOMER_ORDERS_ERROR'
        });
    }
});

export default router;
