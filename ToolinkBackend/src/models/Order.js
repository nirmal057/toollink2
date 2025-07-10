const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    trim: true
  },
  customer: {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      district: String,
      postalCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
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
    notes: String
  }],
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
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'LKR'
    }
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'partially_scheduled',
      'fully_scheduled',
      'partially_dispatched',
      'fully_dispatched',
      'partially_delivered',
      'completed',
      'cancelled',
      'refunded'
    ],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  deliveryPreferences: {
    preferredDate: Date,
    preferredTimeSlot: {
      start: String,
      end: String
    },
    specialInstructions: String,
    contactPerson: {
      name: String,
      phone: String
    }
  },
  paymentInfo: {
    method: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'credit'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded'],
      default: 'pending'
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    dueAmount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  timeline: {
    orderDate: {
      type: Date,
      default: Date.now
    },
    confirmedAt: Date,
    scheduledAt: Date,
    dispatchedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date
  },
  notes: {
    customerNotes: String,
    internalNotes: String,
    deliveryNotes: String
  },
  assignedStaff: {
    salesPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    warehouseManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  trackingInfo: {
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for sub-orders
orderSchema.virtual('subOrders', {
  ref: 'SubOrder',
  localField: '_id',
  foreignField: 'parentOrderId'
});

// Virtual for order age in days
orderSchema.virtual('orderAge').get(function() {
  return Math.floor((Date.now() - this.timeline.orderDate) / (1000 * 60 * 60 * 24));
});

// Virtual for completion percentage
orderSchema.virtual('completionPercentage').get(function() {
  if (!this.subOrders || this.subOrders.length === 0) return 0;
  
  const deliveredSubOrders = this.subOrders.filter(sub => sub.status === 'delivered').length;
  return Math.round((deliveredSubOrders / this.subOrders.length) * 100);
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Find the last order number for today
    const lastOrder = await this.constructor.findOne({
      orderNumber: new RegExp(`^ORD-${year}${month}${day}-`)
    }).sort({ orderNumber: -1 });
    
    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `ORD-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
  }
  next();
});

// Index for efficient queries
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'customer.customerId': 1, status: 1 });
orderSchema.index({ status: 1, 'timeline.orderDate': -1 });
orderSchema.index({ 'timeline.orderDate': -1 });

module.exports = mongoose.model('Order', orderSchema);
