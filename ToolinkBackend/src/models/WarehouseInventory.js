const mongoose = require('mongoose');

const warehouseInventorySchema = new mongoose.Schema({
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['pieces', 'kg', 'tons', 'liters', 'meters', 'bags', 'boxes', 'rolls', 'units']
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  availableQuantity: {
    type: Number,
    default: 0
  },
  threshold: {
    minimum: {
      type: Number,
      required: true,
      min: 0,
      default: 10
    },
    maximum: {
      type: Number,
      min: 0
    },
    reorderPoint: {
      type: Number,
      min: 0
    }
  },
  location: {
    section: String,
    aisle: String,
    shelf: String,
    bin: String,
    coordinates: String // e.g., "A-12-3-B"
  },
  costInfo: {
    averageCost: {
      type: Number,
      default: 0
    },
    lastPurchasePrice: Number,
    totalValue: {
      type: Number,
      default: 0
    }
  },
  qualityInfo: {
    batchNumber: String,
    expiryDate: Date,
    manufacturingDate: Date,
    qualityGrade: {
      type: String,
      enum: ['A', 'B', 'C', 'Rejected'],
      default: 'A'
    }
  },
  movements: [{
    type: {
      type: String,
      enum: ['stock-in', 'stock-out', 'adjustment', 'return', 'transfer', 'damage', 'expired'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: String,
    convertedQuantity: Number, // After unit conversion
    reason: String,
    reference: {
      type: String, // Order ID, Transfer ID, etc.
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  alerts: {
    lowStock: {
      isActive: {
        type: Boolean,
        default: false
      },
      triggeredAt: Date,
      acknowledgedAt: Date,
      acknowledgedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    overstock: {
      isActive: {
        type: Boolean,
        default: false
      },
      triggeredAt: Date
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if stock is low
warehouseInventorySchema.virtual('isLowStock').get(function() {
  return this.availableQuantity <= this.threshold.minimum;
});

// Virtual for checking if stock is overstocked
warehouseInventorySchema.virtual('isOverstock').get(function() {
  return this.threshold.maximum && this.quantity >= this.threshold.maximum;
});

// Virtual for stock turnover calculation (would need sales data)
warehouseInventorySchema.virtual('stockTurnover').get(function() {
  // This would typically calculate based on sales velocity
  // Placeholder implementation
  return 0;
});

// Pre-save middleware to calculate available quantity
warehouseInventorySchema.pre('save', function(next) {
  this.availableQuantity = Math.max(0, this.quantity - this.reservedQuantity);
  this.costInfo.totalValue = this.quantity * this.costInfo.averageCost;
  this.lastUpdated = new Date();
  
  // Check for low stock alert
  if (this.availableQuantity <= this.threshold.minimum && !this.alerts.lowStock.isActive) {
    this.alerts.lowStock.isActive = true;
    this.alerts.lowStock.triggeredAt = new Date();
  } else if (this.availableQuantity > this.threshold.minimum && this.alerts.lowStock.isActive) {
    this.alerts.lowStock.isActive = false;
    this.alerts.lowStock.acknowledgedAt = new Date();
  }
  
  // Check for overstock alert
  if (this.threshold.maximum && this.quantity >= this.threshold.maximum && !this.alerts.overstock.isActive) {
    this.alerts.overstock.isActive = true;
    this.alerts.overstock.triggeredAt = new Date();
  } else if (this.threshold.maximum && this.quantity < this.threshold.maximum && this.alerts.overstock.isActive) {
    this.alerts.overstock.isActive = false;
  }
  
  next();
});

// Compound index for unique inventory per warehouse-material combination
warehouseInventorySchema.index({ warehouseId: 1, materialId: 1 }, { unique: true });
warehouseInventorySchema.index({ warehouseId: 1, materialId: 1, supplierId: 1 });
warehouseInventorySchema.index({ materialId: 1, quantity: 1 });
warehouseInventorySchema.index({ 'alerts.lowStock.isActive': 1 });
warehouseInventorySchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('WarehouseInventory', warehouseInventorySchema);
