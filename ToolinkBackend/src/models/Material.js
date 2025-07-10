const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Building Materials',
      'Roofing Materials',
      'Steel & Metal',
      'Tiles & Ceramics',
      'Plumbing Supplies',
      'Electrical Items',
      'Paint & Chemicals',
      'Tools & Equipment',
      'Hardware & Fasteners',
      'Safety Equipment'
    ]
  },
  description: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['pieces', 'kg', 'liters', 'meters', 'bags', 'boxes', 'rolls']
  },
  pricing: {
    costPrice: {
      type: Number,
      required: true,
      min: 0
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'LKR'
    }
  },
  stock: {
    currentQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    minimumQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    maximumQuantity: {
      type: Number,
      min: 0
    }
  },
  warehouses: [{
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  supplier: {
    name: String,
    phone: String,
    email: String,
    address: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  specifications: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'm', 'mm'],
        default: 'cm'
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total stock across all warehouses
materialSchema.virtual('totalStock').get(function () {
  if (!this.warehouses || !Array.isArray(this.warehouses)) {
    return 0;
  }
  return this.warehouses.reduce((total, warehouse) => total + warehouse.quantity, 0);
});

// Virtual for available stock (not reserved)
materialSchema.virtual('availableStock').get(function () {
  if (!this.warehouses || !Array.isArray(this.warehouses)) {
    return 0;
  }
  return this.warehouses.reduce((total, warehouse) =>
    total + (warehouse.quantity - warehouse.reserved), 0);
});

// Virtual for low stock alert
materialSchema.virtual('lowStockAlert').get(function () {
  const totalStock = this.totalStock || 0;
  const minimumQuantity = this.stock?.minimumQuantity || 0;
  return totalStock <= minimumQuantity;
});

// Index for efficient queries
materialSchema.index({ name: 'text', sku: 'text', category: 'text' });
materialSchema.index({ category: 1, isActive: 1 });
materialSchema.index({ 'warehouses.warehouseId': 1 });

module.exports = mongoose.model('Material', materialSchema);
