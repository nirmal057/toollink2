const mongoose = require('mongoose');

const subOrderSchema = new mongoose.Schema({
  subOrderNumber: {
    type: String,
    unique: true,
    trim: true
  },
  parentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  parentOrderNumber: {
    type: String,
    required: true
  },
  warehouse: {
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true
    },
    warehouseName: String,
    warehouseLocation: String
  },
  items: [{
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: true
    },
    materialName: String,
    materialSku: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unit: String,
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    availableQuantity: {
      type: Number,
      default: 0
    },
    allocatedQuantity: {
      type: Number,
      default: 0
    }
  }],
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'allocated',
      'picking',
      'packed',
      'ready_for_dispatch',
      'dispatched',
      'in_transit',
      'delivered',
      'cancelled',
      'returned'
    ],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    deliveryCharges: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  deliveryInfo: {
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    deliveryMethod: {
      type: String,
      enum: ['pickup', 'delivery', 'courier'],
      default: 'delivery'
    },
    vehicleInfo: {
      vehicleNumber: String,
      driverName: String,
      driverContact: String
    },
    trackingNumber: String
  },
  timeline: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    confirmedAt: Date,
    allocatedAt: Date,
    packedAt: Date,
    dispatchedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date
  },
  assignedStaff: {
    warehouseStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    picker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dispatcher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  notes: {
    warehouseNotes: String,
    pickingNotes: String,
    deliveryNotes: String,
    internalNotes: String
  },
  qualityCheck: {
    checked: {
      type: Boolean,
      default: false
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedAt: Date,
    issues: [String],
    approved: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total items count
subOrderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for completion status
subOrderSchema.virtual('isCompleted').get(function() {
  return ['delivered', 'cancelled', 'returned'].includes(this.status);
});

// Virtual for processing time in hours
subOrderSchema.virtual('processingTime').get(function() {
  if (!this.timeline.deliveredAt) return null;
  return Math.floor((this.timeline.deliveredAt - this.timeline.createdAt) / (1000 * 60 * 60));
});

// Pre-save middleware to generate sub-order number
subOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.subOrderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Find the last sub-order number for today
    const lastSubOrder = await this.constructor.findOne({
      subOrderNumber: new RegExp(`^SUB-${year}${month}${day}-`)
    }).sort({ subOrderNumber: -1 });
    
    let sequence = 1;
    if (lastSubOrder) {
      const lastSequence = parseInt(lastSubOrder.subOrderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.subOrderNumber = `SUB-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
  }
  next();
});

// Indexes for efficient queries
subOrderSchema.index({ subOrderNumber: 1 });
subOrderSchema.index({ parentOrderId: 1, status: 1 });
subOrderSchema.index({ 'warehouse.warehouseId': 1, status: 1 });
subOrderSchema.index({ status: 1, 'timeline.createdAt': -1 });

module.exports = mongoose.model('SubOrder', subOrderSchema);
