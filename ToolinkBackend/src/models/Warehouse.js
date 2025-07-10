const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
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
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    postalCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  capacity: {
    totalSpace: Number,
    usedSpace: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      enum: ['sqm', 'sqft', 'cubic_m'],
      default: 'sqm'
    }
  },
  contactInfo: {
    manager: String,
    phone: String,
    email: String
  },
  operatingHours: {
    weekdays: {
      open: String,
      close: String
    },
    weekends: {
      open: String,
      close: String
    }
  },
  capabilities: [{
    type: String,
    enum: ['storage', 'packaging', 'loading', 'refrigerated', 'hazmat']
  }],
  deliveryZones: [{
    district: String,
    estimatedDeliveryDays: {
      type: Number,
      min: 1,
      max: 30
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for available space
warehouseSchema.virtual('availableSpace').get(function() {
  if (!this.capacity.totalSpace) return null;
  return this.capacity.totalSpace - this.capacity.usedSpace;
});

// Virtual for capacity utilization percentage
warehouseSchema.virtual('utilizationPercentage').get(function() {
  if (!this.capacity.totalSpace) return 0;
  return Math.round((this.capacity.usedSpace / this.capacity.totalSpace) * 100);
});

// Index for efficient queries
warehouseSchema.index({ 'location.district': 1, isActive: 1 });
warehouseSchema.index({ code: 1 });

module.exports = mongoose.model('Warehouse', warehouseSchema);
