const Inventory = require('../models/WarehouseInventory');
const Material = require('../models/Material');
const Warehouse = require('../models/Warehouse');
const Supplier = require('../models/Supplier');
const { convertUnits, normalizeUnit } = require('../utils/unitConversions');

class InventoryController {
  // Stock in
  static async stockIn(req, res) {
    try {
      const { warehouseId, materialId, quantity, unit, supplierId, reference } = req.body;
      if (!warehouseId || !materialId || quantity == null || !unit) {
        return res.status(400).json({ success: false, error: 'warehouseId, materialId, quantity and unit are required' });
      }
      // normalize unit
      const normUnit = normalizeUnit(unit);
      // find or create inventory record
      let record = await Inventory.findOne({ warehouseId, materialId, supplierId });
      if (!record) {
        record = new Inventory({ warehouseId, materialId, supplierId, quantity: 0, unit: normUnit });
      }
      // convert incoming quantity to record.unit
      const conv = convertUnits(quantity, normUnit, record.unit);
      if (!conv.success) {
        return res.status(400).json({ success: false, error: conv.error });
      }
      record.quantity += conv.convertedQuantity;
      record.movements.push({ type: 'stock-in', quantity, unit: normUnit, convertedQuantity: conv.convertedQuantity, reference, performedBy: req.user._id });
      await record.save();
      res.json({ success: true, data: record });
    } catch (err) {
      console.error('StockIn error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
  
  // Stock out
  static async stockOut(req, res) {
    try {
      const { warehouseId, materialId, quantity, unit, reference } = req.body;
      if (!warehouseId || !materialId || quantity == null || !unit) {
        return res.status(400).json({ success: false, error: 'warehouseId, materialId, quantity and unit are required' });
      }
      const normUnit = normalizeUnit(unit);
      const record = await Inventory.findOne({ warehouseId, materialId });
      if (!record) {
        return res.status(404).json({ success: false, error: 'Inventory record not found' });
      }
      const conv = convertUnits(quantity, normUnit, record.unit);
      if (!conv.success) {
        return res.status(400).json({ success: false, error: conv.error });
      }
      if (record.availableQuantity < conv.convertedQuantity) {
        return res.status(400).json({ success: false, error: 'Insufficient stock' });
      }
      record.quantity -= conv.convertedQuantity;
      record.movements.push({ type: 'stock-out', quantity, unit: normUnit, convertedQuantity: conv.convertedQuantity, reference, performedBy: req.user._id });
      await record.save();
      res.json({ success: true, data: record });
    } catch (err) {
      console.error('StockOut error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
  
  // Adjust inventory manually
  static async adjust(req, res) {
    try {
      const { warehouseId, materialId, quantity, unit, reason } = req.body;
      if (!warehouseId || !materialId || quantity == null) {
        return res.status(400).json({ success: false, error: 'warehouseId, materialId and quantity are required' });
      }
      const normUnit = unit ? normalizeUnit(unit) : null;
      let record = await Inventory.findOne({ warehouseId, materialId });
      if (!record) {
        return res.status(404).json({ success: false, error: 'Inventory record not found' });
      }
      let convQty = quantity;
      if (unit) {
        const conv = convertUnits(quantity, normUnit, record.unit);
        if (!conv.success) return res.status(400).json({ success: false, error: conv.error });
        convQty = conv.convertedQuantity;
      }
      record.quantity += convQty;
      record.movements.push({ type: 'adjustment', quantity: convQty, unit: record.unit, reason, performedBy: req.user._id });
      await record.save();
      res.json({ success: true, data: record });
    } catch (err) {
      console.error('Adjust error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
  
  // Get low stock
  static async lowStock(req, res) {
    try {
      const list = await Inventory.find({ 'alerts.lowStock.isActive': true })
        .populate('warehouseId', 'name')
        .populate('materialId', 'name sku')
        .populate('supplierId', 'name');
      res.json({ success: true, data: list });
    } catch (err) {
      console.error('LowStock error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
  
  // Get inventory by filters
  static async list(req, res) {
    try {
      const { warehouseId, materialId, supplierId } = req.query;
      const filter = {};
      if (warehouseId) filter.warehouseId = warehouseId;
      if (materialId) filter.materialId = materialId;
      if (supplierId) filter.supplierId = supplierId;
      const list = await Inventory.find(filter)
        .populate('warehouseId', 'name')
        .populate('materialId', 'name sku')
        .populate('supplierId', 'name');
      res.json({ success: true, data: list });
    } catch (err) {
      console.error('List error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Create new material (for inventory management UI)
  static async create(req, res) {
    try {
      const materialData = req.body;
      
      // Validate required fields
      const requiredFields = ['name', 'sku', 'category'];
      for (const field of requiredFields) {
        if (!materialData[field]) {
          return res.status(400).json({
            success: false,
            error: `${field} is required`
          });
        }
      }

      // Validate unit in stock object
      if (!materialData.stock?.unit) {
        return res.status(400).json({
          success: false,
          error: 'stock.unit is required'
        });
      }

      // Check if SKU already exists
      const existingMaterial = await Material.findOne({ sku: materialData.sku });
      if (existingMaterial) {
        return res.status(400).json({
          success: false,
          error: 'SKU already exists'
        });
      }

      // Ensure pricing object exists
      if (!materialData.pricing) {
        materialData.pricing = {
          costPrice: 0,
          sellingPrice: 0,
          currency: 'LKR'
        };
      }

      // Extract unit from stock object and add it to root level for compatibility
      materialData.unit = materialData.stock.unit;

      // Create material
      const material = new Material({
        ...materialData,
        createdBy: req.user?._id,
        lastModifiedBy: req.user?._id
      });

      await material.save();

      res.status(201).json({
        success: true,
        message: 'Material created successfully',
        item: material
      });

    } catch (error) {
      console.error('Create material error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create material'
      });
    }
  }
}

module.exports = InventoryController;
