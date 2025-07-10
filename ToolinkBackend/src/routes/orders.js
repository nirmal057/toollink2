const express = require('express');
const OrderController = require('../controllers/orderController');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Create a new order
router.post('/', authenticateToken, OrderController.createOrder);

// Get all orders with pagination and filtering
router.get('/', authenticateToken, OrderController.getOrders);

// Get order statistics
router.get('/stats', authenticateToken, OrderController.getOrderStats);

// Search orders
router.get('/search', authenticateToken, OrderController.searchOrders);

// Get order by ID
router.get('/:id', authenticateToken, OrderController.getOrderById);

// Update order status
router.patch('/:id/status', authenticateToken, authorize(['admin', 'manager', 'staff']), OrderController.updateOrderStatus);

// Get sub-orders for an order
router.get('/:orderId/sub-orders', authenticateToken, OrderController.getSubOrders);

// Update sub-order status
router.patch('/sub-orders/:id/status', authenticateToken, authorize(['admin', 'manager', 'staff']), OrderController.updateSubOrderStatus);

module.exports = router;
