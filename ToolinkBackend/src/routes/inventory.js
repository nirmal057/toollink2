const express = require('express');
const InventoryController = require('../controllers/inventoryController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create new material (for inventory management UI)
router.post('/', authenticateToken, InventoryController.create);

// Stock-in operation
router.post('/stock-in', authenticateToken, InventoryController.stockIn);

// Stock-out operation
router.post('/stock-out', authenticateToken, InventoryController.stockOut);

// Manual adjustment (increase or decrease stock)
router.post('/adjust', authenticateToken, InventoryController.adjust);

// Get low stock items (alerts)
router.get('/low-stock', authenticateToken, InventoryController.lowStock);

// List inventory with optional filters
router.get('/', authenticateToken, InventoryController.list);

module.exports = router;
