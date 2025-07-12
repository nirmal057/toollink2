import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true
        // Not required here since it's auto-generated in pre-save hook
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        inventory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
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
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        min: 0,
        default: 0
    },
    tax: {
        type: Number,
        min: 0,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'refunded', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'bank_transfer', 'cheque', 'credit'],
        default: 'cash'
    },
    shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, default: 'Sri Lanka' },
        phone: String,
        instructions: String
    },
    billingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: 'Sri Lanka' },
        phone: String
    },
    delivery: {
        method: {
            type: String,
            enum: ['pickup', 'delivery', 'courier'],
            default: 'delivery'
        },
        estimatedDate: Date,
        actualDate: Date,
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        trackingNumber: String,
        notes: String
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: Date,
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedAt: Date,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: String,
    internalNotes: String,
    attachments: [{
        filename: String,
        originalName: String,
        url: String,
        size: Number,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String
    }],
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for order age in days
orderSchema.virtual('ageInDays').get(function () {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function () {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for order status display
orderSchema.virtual('statusDisplay').get(function () {
    return this.status.replace('_', ' ').toUpperCase();
});

// Index for performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'delivery.estimatedDate': 1 });
orderSchema.index({ deletedAt: 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        // Count orders for today
        const todayStart = new Date(year, today.getMonth(), today.getDate());
        const todayEnd = new Date(year, today.getMonth(), today.getDate() + 1);

        const todayOrderCount = await this.constructor.countDocuments({
            createdAt: { $gte: todayStart, $lt: todayEnd },
            deletedAt: null
        });

        const orderSequence = String(todayOrderCount + 1).padStart(4, '0');
        this.orderNumber = `ORD-${year}${month}${day}-${orderSequence}`;
    }

    // Calculate final amount
    this.finalAmount = this.totalAmount - this.discount + this.tax;

    // Add status history entry
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            updatedBy: this.updatedBy,
            notes: this.notes
        });
    }

    next();
});

// Static method to get order statistics
orderSchema.statics.getStatistics = async function () {
    const stats = await this.aggregate([
        { $match: { deletedAt: null } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                processingOrders: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
                shippedOrders: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] } },
                deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                totalRevenue: { $sum: '$finalAmount' },
                averageOrderValue: { $avg: '$finalAmount' }
            }
        }
    ]);

    // Get monthly revenue
    const monthlyRevenue = await this.aggregate([
        { $match: { deletedAt: null, status: { $in: ['delivered', 'shipped'] } } },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                revenue: { $sum: '$finalAmount' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
    ]);

    const result = stats[0] || {
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0
    };

    result.monthlyRevenue = monthlyRevenue;

    return result;
};

// Static method to get orders by customer
orderSchema.statics.getOrdersByCustomer = async function (customerId, options = {}) {
    const { page = 1, limit = 10, status } = options;

    const filter = {
        customer: customerId,
        deletedAt: null
    };

    if (status) {
        filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
        this.find(filter)
            .populate('customer', 'fullName email phone')
            .populate('items.inventory', 'name sku unit')
            .populate('delivery.driver', 'fullName phone')
            .populate('approvedBy', 'fullName')
            .populate('processedBy', 'fullName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        this.countDocuments(filter)
    ]);

    return {
        orders,
        total,
        page,
        pages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
    };
};

// Static method to search orders
orderSchema.statics.searchOrders = async function (query, options = {}) {
    const {
        status,
        customer,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sort = '-createdAt'
    } = options;

    const filter = {
        deletedAt: null
    };

    if (query) {
        filter.$or = [
            { orderNumber: { $regex: query, $options: 'i' } },
            { notes: { $regex: query, $options: 'i' } },
            { 'delivery.trackingNumber': { $regex: query, $options: 'i' } }
        ];
    }

    if (status) {
        filter.status = status;
    }

    if (customer) {
        filter.customer = customer;
    }

    if (startDate && endDate) {
        filter.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
        this.find(filter)
            .populate('customer', 'fullName email phone')
            .populate('items.inventory', 'name sku unit')
            .populate('delivery.driver', 'fullName phone')
            .populate('approvedBy', 'fullName')
            .populate('processedBy', 'fullName')
            .sort(sort)
            .skip(skip)
            .limit(limit),
        this.countDocuments(filter)
    ]);

    return {
        orders,
        total,
        page,
        pages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
    };
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
