const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Tools', 'Hardware', 'Electrical', 'Plumbing', 'Safety', 'Building Materials', 'Fasteners', 'Automotive', 'Other'],
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  specifications: {
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, enum: ['mm', 'cm', 'in', 'ft'], default: 'mm' }
    },
    weight: {
      value: Number,
      unit: { type: String, enum: ['g', 'kg', 'lb', 'oz'], default: 'kg' }
    },
    material: String,
    color: String,
    finish: String,
    grade: String,
    other: mongoose.Schema.Types.Mixed
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
    wholesalePrice: {
      type: Number,
      min: 0
    },
    discountPrice: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
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
      default: 10
    },
    maximumQuantity: {
      type: Number,
      min: 0
    },
    reorderLevel: {
      type: Number,
      min: 0
    },
    reorderQuantity: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['piece', 'kg', 'lb', 'meter', 'feet', 'liter', 'gallon', 'box', 'pack', 'roll', 'sheet'],
      default: 'piece'
    }
  },
  location: {
    warehouse: {
      type: String,
      required: true,
      default: 'Main Warehouse'
    },
    zone: String,
    aisle: String,
    shelf: String,
    bin: String,
    coordinates: {
      x: Number,
      y: Number,
      z: Number
    }
  },
  supplier: {
    name: String,
    contactPerson: String,
    email: String,
    phone: String,
    address: String,
    leadTime: Number, // in days
    minimumOrderQuantity: Number
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  documents: [{
    name: String,
    url: String,
    type: { type: String, enum: ['manual', 'datasheet', 'certificate', 'warranty', 'other'] }
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isDiscontinued: {
    type: Boolean,
    default: false
  },
  qualityRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  popularityScore: {
    type: Number,
    default: 0
  },
  seasonality: {
    type: String,
    enum: ['Year-round', 'Spring', 'Summer', 'Fall', 'Winter', 'Holiday'],
    default: 'Year-round'
  },
  hazardous: {
    isHazardous: { type: Boolean, default: false },
    hazardClass: String,
    storageRequirements: String,
    handlingInstructions: String
  },
  maintenance: {
    lastInspection: Date,
    nextInspection: Date,
    inspectionFrequency: Number, // in days
    condition: { type: String, enum: ['Excellent', 'Good', 'Fair', 'Poor'], default: 'Good' }
  },
  analytics: {
    totalSold: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageOrderQuantity: { type: Number, default: 0 },
    lastSold: Date,
    topCustomers: [{
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      quantity: Number,
      revenue: Number
    }]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
inventorySchema.index({ category: 1, subcategory: 1 });
inventorySchema.index({ 'stock.currentQuantity': 1, 'stock.minimumQuantity': 1 });
inventorySchema.index({ 'location.warehouse': 1, 'location.zone': 1 });
inventorySchema.index({ isActive: 1, isDiscontinued: 1 });
inventorySchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function() {
  if (this.stock.currentQuantity <= 0) return 'Out of Stock';
  if (this.stock.currentQuantity <= this.stock.minimumQuantity) return 'Low Stock';
  if (this.stock.reorderLevel && this.stock.currentQuantity <= this.stock.reorderLevel) return 'Reorder Required';
  return 'In Stock';
});

// Virtual for profit margin
inventorySchema.virtual('profitMargin').get(function() {
  if (this.pricing.costPrice > 0) {
    return ((this.pricing.sellingPrice - this.pricing.costPrice) / this.pricing.costPrice * 100).toFixed(2);
  }
  return 0;
});

// Virtual for full location
inventorySchema.virtual('fullLocation').get(function() {
  const parts = [
    this.location.warehouse,
    this.location.zone,
    this.location.aisle,
    this.location.shelf,
    this.location.bin
  ].filter(Boolean);
  return parts.join(' - ');
});

// Pre-save middleware
inventorySchema.pre('save', function(next) {
  // Ensure SKU is uppercase
  if (this.sku) {
    this.sku = this.sku.toUpperCase();
  }
  
  // Update analytics
  if (this.isModified('stock.currentQuantity')) {
    // Logic for updating analytics would go here
  }
  
  next();
});

// Instance methods
inventorySchema.methods.updateStock = function(quantity, operation, userId, reason) {
  const stockHistory = {
    operation, // 'add', 'remove', 'adjust'
    quantity,
    previousQuantity: this.stock.currentQuantity,
    userId,
    reason,
    timestamp: new Date()
  };
  
  switch (operation) {
    case 'add':
      this.stock.currentQuantity += quantity;
      break;
    case 'remove':
      this.stock.currentQuantity = Math.max(0, this.stock.currentQuantity - quantity);
      break;
    case 'adjust':
      this.stock.currentQuantity = quantity;
      break;
  }
  
  // Add to history (would need a separate StockHistory model)
  // this.stockHistory.push(stockHistory);
  
  return this.save();
};

inventorySchema.methods.isLowStock = function() {
  return this.stock.currentQuantity <= this.stock.minimumQuantity;
};

inventorySchema.methods.needsReorder = function() {
  return this.stock.reorderLevel && this.stock.currentQuantity <= this.stock.reorderLevel;
};

inventorySchema.methods.calculateReorderQuantity = function() {
  if (this.stock.reorderQuantity) {
    return this.stock.reorderQuantity;
  }
  // Default to bringing stock to maximum or 2x minimum
  const target = this.stock.maximumQuantity || (this.stock.minimumQuantity * 2);
  return Math.max(0, target - this.stock.currentQuantity);
};

// Static methods
inventorySchema.statics.findLowStock = function() {
  return this.find({
    $expr: { $lte: ['$stock.currentQuantity', '$stock.minimumQuantity'] },
    isActive: true
  });
};

inventorySchema.statics.findOutOfStock = function() {
  return this.find({
    'stock.currentQuantity': { $lte: 0 },
    isActive: true
  });
};

inventorySchema.statics.findByCategory = function(category, subcategory) {
  const query = { category, isActive: true };
  if (subcategory) query.subcategory = subcategory;
  return this.find(query);
};

module.exports = mongoose.model('Inventory', inventorySchema);
