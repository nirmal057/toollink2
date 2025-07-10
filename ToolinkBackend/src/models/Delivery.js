const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  deliveryNumber: {
    type: String,
    unique: true,
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Transit', 'Delivered', 'Failed', 'Cancelled', 'Rescheduled'],
    default: 'Scheduled'
  },
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTimeSlot: {
    start: String, // e.g., "09:00"
    end: String    // e.g., "12:00"
  },
  actualStartTime: Date,
  actualEndTime: Date,
  estimatedDuration: Number, // in minutes
  actualDuration: Number,    // in minutes
  pickupLocation: {
    name: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'USA' }
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    contactPerson: String,
    contactPhone: String,
    instructions: String
  },
  deliveryLocation: {
    name: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'USA' }
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    contactPerson: String,
    contactPhone: String,
    instructions: String,
    accessCodes: String,
    specialInstructions: String
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    name: String,
    quantity: Number,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: String
    },
    fragile: { type: Boolean, default: false },
    hazardous: { type: Boolean, default: false },
    specialHandling: String
  }],
  route: {
    distance: Number, // in kilometers
    estimatedTravelTime: Number, // in minutes
    actualTravelTime: Number,
    waypoints: [{
      latitude: Number,
      longitude: Number,
      timestamp: Date,
      notes: String
    }],
    trafficConditions: String,
    weatherConditions: String
  },
  delivery: {
    attemptNumber: { type: Number, default: 1 },
    deliveredAt: Date,
    receivedBy: String,
    receiverSignature: String, // URL to signature image
    receiverIdVerified: { type: Boolean, default: false },
    photoProof: [String], // URLs to delivery photos
    deliveryNotes: String,
    customerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    customerFeedback: String
  },
  failureReason: {
    type: String,
    enum: ['Customer Not Available', 'Wrong Address', 'Access Denied', 'Weather', 'Vehicle Issue', 'Traffic', 'Other']
  },
  rescheduleReason: String,
  rescheduleDate: Date,
  costs: {
    fuel: Number,
    tolls: Number,
    parking: Number,
    other: Number,
    total: Number
  },
  documents: [{
    type: { type: String, enum: ['Invoice', 'Receipt', 'Delivery Note', 'Photo', 'Signature', 'Other'] },
    url: String,
    filename: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  notifications: [{
    type: { type: String, enum: ['SMS', 'Email', 'Push', 'Call'] },
    recipient: String,
    message: String,
    sentAt: Date,
    delivered: Boolean,
    response: String
  }],
  tracking: [{
    status: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    timestamp: { type: Date, default: Date.now },
    notes: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  specialRequirements: {
    appointmentRequired: { type: Boolean, default: false },
    signatureRequired: { type: Boolean, default: true },
    idVerificationRequired: { type: Boolean, default: false },
    photographRequired: { type: Boolean, default: false },
    equipmentNeeded: [String],
    teamSize: { type: Number, default: 1 }
  },
  weather: {
    condition: String,
    temperature: Number,
    humidity: Number,
    windSpeed: Number,
    precipitation: Number
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

// Indexes (deliveryNumber already indexed by unique: true)
deliverySchema.index({ orderId: 1 });
deliverySchema.index({ customerId: 1 });
deliverySchema.index({ driverId: 1 });
deliverySchema.index({ status: 1 });
deliverySchema.index({ scheduledDate: 1 });
deliverySchema.index({ 'deliveryLocation.address.zipCode': 1 });

// Pre-save middleware to generate delivery number
deliverySchema.pre('save', async function(next) {
  if (this.isNew && !this.deliveryNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const lastDelivery = await this.constructor.findOne({
      deliveryNumber: new RegExp(`^DL${year}${month}${day}`)
    }).sort({ deliveryNumber: -1 });
    
    let sequence = 1;
    if (lastDelivery && lastDelivery.deliveryNumber) {
      const lastSequence = parseInt(lastDelivery.deliveryNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.deliveryNumber = `DL${year}${month}${day}${String(sequence).padStart(4, '0')}`;
  }
  next();
});

// Add tracking entry when status changes
deliverySchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.tracking.push({
      status: this.status,
      timestamp: new Date(),
      notes: `Status changed to ${this.status}`
    });
  }
  next();
});

// Virtual for delivery duration
deliverySchema.virtual('totalDuration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60)); // in minutes
  }
  return null;
});

// Virtual for delivery status
deliverySchema.virtual('isOnTime').get(function() {
  if (this.status === 'Delivered' && this.delivery.deliveredAt) {
    const scheduledEnd = new Date(this.scheduledDate);
    scheduledEnd.setHours(parseInt(this.scheduledTimeSlot.end.split(':')[0]));
    scheduledEnd.setMinutes(parseInt(this.scheduledTimeSlot.end.split(':')[1]));
    return this.delivery.deliveredAt <= scheduledEnd;
  }
  return null;
});

// Virtual for current location
deliverySchema.virtual('currentLocation').get(function() {
  if (this.tracking.length > 0) {
    return this.tracking[this.tracking.length - 1].location;
  }
  return null;
});

// Instance methods
deliverySchema.methods.updateStatus = function(newStatus, userId, location, notes) {
  this.status = newStatus;
  
  const trackingEntry = {
    status: newStatus,
    timestamp: new Date(),
    notes,
    updatedBy: userId
  };
  
  if (location) {
    trackingEntry.location = location;
  }
  
  this.tracking.push(trackingEntry);
  
  // Set specific timestamps based on status
  switch (newStatus) {
    case 'In Transit':
      if (!this.actualStartTime) {
        this.actualStartTime = new Date();
      }
      break;
    case 'Delivered':
      if (!this.actualEndTime) {
        this.actualEndTime = new Date();
        this.delivery.deliveredAt = new Date();
      }
      break;
  }
  
  return this.save();
};

deliverySchema.methods.addNotification = function(type, recipient, message) {
  this.notifications.push({
    type,
    recipient,
    message,
    sentAt: new Date()
  });
  return this.save();
};

deliverySchema.methods.reschedule = function(newDate, reason, userId) {
  this.rescheduleDate = newDate;
  this.rescheduleReason = reason;
  this.status = 'Rescheduled';
  this.delivery.attemptNumber += 1;
  
  this.tracking.push({
    status: 'Rescheduled',
    timestamp: new Date(),
    notes: `Rescheduled: ${reason}`,
    updatedBy: userId
  });
  
  return this.save();
};

deliverySchema.methods.markAsDelivered = function(receivedBy, signature, photos, notes, rating) {
  this.status = 'Delivered';
  this.actualEndTime = new Date();
  this.delivery.deliveredAt = new Date();
  this.delivery.receivedBy = receivedBy;
  this.delivery.receiverSignature = signature;
  this.delivery.photoProof = photos || [];
  this.delivery.deliveryNotes = notes;
  this.delivery.customerRating = rating;
  
  this.tracking.push({
    status: 'Delivered',
    timestamp: new Date(),
    notes: `Delivered to ${receivedBy}`
  });
  
  return this.save();
};

// Static methods
deliverySchema.statics.findByDriver = function(driverId, date) {
  const query = { driverId };
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
  }
  return this.find(query).populate('orderId customerId');
};

deliverySchema.statics.findByCustomer = function(customerId) {
  return this.find({ customerId }).populate('orderId driverId');
};

deliverySchema.statics.findOverdue = function() {
  return this.find({
    scheduledDate: { $lt: new Date() },
    status: { $nin: ['Delivered', 'Cancelled'] }
  });
};

module.exports = mongoose.model('Delivery', deliverySchema);
