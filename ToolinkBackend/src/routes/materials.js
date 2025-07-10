const express = require('express');
const MaterialController = require('../controllers/materialController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create new material
router.post('/', authenticateToken, MaterialController.create);

// Get all materials
router.get('/', authenticateToken, MaterialController.list);

// Get material categories
router.get('/categories', authenticateToken, MaterialController.getCategories);

// Get material by ID
router.get('/:id', authenticateToken, MaterialController.getById);

// Update material
router.put('/:id', authenticateToken, MaterialController.update);

// Delete material
router.delete('/:id', authenticateToken, MaterialController.delete);

module.exports = router;
