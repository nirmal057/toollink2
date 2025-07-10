const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  contactInfo: {
    contactPerson: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    address: {
      street: String,
      city: String,
      district: String,
      postalCode: String,
      country: {
        type: String,
        default: 'Sri Lanka'
      }
    }
  },
  businessInfo: {
    registrationNumber: String,
    taxId: String,
    businessType: {
      type: String,
      enum: ['Manufacturer', 'Distributor', 'Wholesaler', 'Retailer', 'Import/Export'],
      default: 'Distributor'
    }
  },
  paymentTerms: {
    creditPeriod: {
      type: Number,
      default: 30 // days
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Credit', 'Bank Transfer', 'Cheque'],
      default: 'Credit'
    },
    creditLimit: {
      type: Number,
      default: 0
    }
  },
  materials: [{
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    supplierSku: String,
    minOrderQuantity: {
      type: Number,
      default: 1
    },
    leadTime: {
      type: Number,
      default: 7 // days
    },
    lastSupplyDate: Date,
    priceHistory: [{
      price: Number,
      date: {
        type: Date,
        default: Date.now
      },
      currency: {
        type: String,
        default: 'LKR'
      }
    }]
  }],
  performance: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    onTimeDeliveries: {
      type: Number,
      default: 0
    },
    qualityScore: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for delivery performance percentage
supplierSchema.virtual('deliveryPerformance').get(function() {
  if (this.performance.totalOrders === 0) return 0;
  return Math.round((this.performance.onTimeDeliveries / this.performance.totalOrders) * 100);
});

// Virtual for current outstanding amount (would need to calculate from orders)
supplierSchema.virtual('outstandingAmount').get(function() {
  // This would typically be calculated from pending invoices/orders
  return 0; // Placeholder
});

// Indexes for efficient queries
supplierSchema.index({ name: 'text', code: 'text' });
supplierSchema.index({ code: 1 });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ 'materials.materialId': 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
