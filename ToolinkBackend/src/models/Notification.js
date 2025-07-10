const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'urgent'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['system', 'order', 'delivery', 'inventory', 'user', 'payment', 'security', 'maintenance'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'critical'],
    default: 'normal'
  },
  recipient: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'warehouse', 'cashier', 'customer', 'driver', 'editor', 'all']
    },
    department: String,
    specific: Boolean // true if sent to specific users, false if broadcast
  },
  sender: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    system: {
      type: Boolean,
      default: false
    },
    name: String
  },
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveryStatus: {
    email: {
      sent: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      bounced: { type: Boolean, default: false },
      sentAt: Date,
      deliveredAt: Date,
      error: String
    },
    sms: {
      sent: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      failed: { type: Boolean, default: false },
      sentAt: Date,
      deliveredAt: Date,
      error: String
    },
    push: {
      sent: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      clicked: { type: Boolean, default: false },
      sentAt: Date,
      deliveredAt: Date,
      clickedAt: Date,
      error: String
    }
  },
  relatedEntity: {
    type: String,
    enum: ['order', 'delivery', 'inventory', 'user', 'payment', 'system'],
    required: false
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  actionUrl: String, // URL to take action or view related item
  actionText: String, // Text for action button
  metadata: {
    orderNumber: String,
    deliveryNumber: String,
    productName: String,
    customerName: String,
    amount: Number,
    tags: [String],
    customData: mongoose.Schema.Types.Mixed
  },
  scheduledFor: Date, // For scheduled notifications
  expiresAt: Date,   // When notification becomes irrelevant
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  template: {
    id: String,
    version: String,
    variables: mongoose.Schema.Types.Mixed
  },
  statistics: {
    totalSent: { type: Number, default: 0 },
    totalDelivered: { type: Number, default: 0 },
    totalRead: { type: Number, default: 0 },
    totalClicked: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 },
    openRate: { type: Number, default: 0 },
    clickRate: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ 'recipient.userId': 1, status: 1 });
notificationSchema.index({ 'recipient.role': 1, status: 1 });
notificationSchema.index({ category: 1, type: 1 });
notificationSchema.index({ priority: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ isArchived: 1 });
notificationSchema.index({ relatedEntity: 1, relatedEntityId: 1 });

// TTL index for automatic cleanup of expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for read status
notificationSchema.virtual('isRead').get(function() {
  return this.status === 'read' || this.readBy.length > 0;
});

// Virtual for delivery success rate
notificationSchema.virtual('deliverySuccessRate').get(function() {
  const total = this.statistics.totalSent;
  const delivered = this.statistics.totalDelivered;
  return total > 0 ? (delivered / total * 100).toFixed(2) : 0;
});

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Set expiration date if not set (default 30 days for most notifications)
  if (!this.expiresAt && this.isNew) {
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    this.expiresAt = defaultExpiry;
    
    // Shorter expiry for certain types
    if (this.category === 'system' && this.priority === 'critical') {
      defaultExpiry.setDate(defaultExpiry.getDate() - 23); // 7 days
      this.expiresAt = defaultExpiry;
    }
  }
  
  next();
});

// Instance methods
notificationSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(read => read.userId.toString() === userId.toString())) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
    this.status = 'read';
    this.statistics.totalRead += 1;
  }
  return this.save();
};

notificationSchema.methods.markAsDelivered = function(channel) {
  this.status = 'delivered';
  
  if (channel && this.deliveryStatus[channel]) {
    this.deliveryStatus[channel].delivered = true;
    this.deliveryStatus[channel].deliveredAt = new Date();
  }
  
  this.statistics.totalDelivered += 1;
  return this.save();
};

notificationSchema.methods.markAsFailed = function(channel, error) {
  this.status = 'failed';
  
  if (channel && this.deliveryStatus[channel]) {
    this.deliveryStatus[channel].failed = true;
    this.deliveryStatus[channel].error = error;
  }
  
  return this.save();
};

notificationSchema.methods.archive = function(userId) {
  this.isArchived = true;
  this.archivedAt = new Date();
  this.archivedBy = userId;
  return this.save();
};

notificationSchema.methods.updateStatistics = function() {
  // Recalculate statistics
  this.statistics.totalRead = this.readBy.length;
  
  if (this.statistics.totalSent > 0) {
    this.statistics.openRate = (this.statistics.totalRead / this.statistics.totalSent * 100);
    this.statistics.bounceRate = ((this.statistics.totalSent - this.statistics.totalDelivered) / this.statistics.totalSent * 100);
  }
  
  return this.save();
};

// Static methods
notificationSchema.statics.findForUser = function(userId, options = {}) {
  const query = {
    $or: [
      { 'recipient.userId': userId },
      { 'recipient.role': 'all' }
    ],
    isArchived: options.includeArchived || false
  };
  
  if (options.unreadOnly) {
    query.status = { $ne: 'read' };
    query['readBy.userId'] = { $ne: userId };
  }
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.priority) {
    query.priority = options.priority;
  }
  
  return this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .limit(options.limit || 50);
};

notificationSchema.statics.findByRole = function(role, options = {}) {
  const query = {
    'recipient.role': { $in: [role, 'all'] },
    isArchived: false
  };
  
  if (options.category) {
    query.category = options.category;
  }
  
  return this.find(query).sort({ priority: -1, createdAt: -1 });
};

notificationSchema.statics.findUnread = function(userId) {
  return this.find({
    $or: [
      { 'recipient.userId': userId },
      { 'recipient.role': 'all' }
    ],
    status: { $ne: 'read' },
    'readBy.userId': { $ne: userId },
    isArchived: false
  }).sort({ priority: -1, createdAt: -1 });
};

notificationSchema.statics.findExpired = function() {
  return this.find({
    expiresAt: { $lt: new Date() },
    isArchived: false
  });
};

notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    $or: [
      { 'recipient.userId': userId },
      { 'recipient.role': 'all' }
    ],
    status: { $ne: 'read' },
    'readBy.userId': { $ne: userId },
    isArchived: false
  });
};

notificationSchema.statics.createSystemNotification = function(data) {
  return this.create({
    ...data,
    sender: {
      system: true,
      name: 'System'
    },
    recipient: {
      role: data.recipient.role || 'all',
      specific: false
    }
  });
};

notificationSchema.statics.createOrderNotification = function(order, type, message) {
  return this.create({
    title: `Order ${type}`,
    message,
    type: type === 'cancelled' ? 'error' : 'info',
    category: 'order',
    recipient: {
      userId: order.customerId,
      specific: true
    },
    relatedEntity: 'order',
    relatedEntityId: order._id,
    metadata: {
      orderNumber: order.orderNumber,
      customerName: order.customer,
      amount: order.finalAmount
    },
    actionUrl: `/orders/${order._id}`,
    actionText: 'View Order'
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
