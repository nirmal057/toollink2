import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['pending', 'assigned', 'out_from_warehouse', 'on_the_way', 'delivered', 'failed', 'cancelled'],
        default: 'pending'
    },
    customerName: {
        type: String,
        required: true
    },
    customerPhone: String,
    customerEmail: String,
    deliveryAddress: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['normal', 'urgent'],
        default: 'normal'
    },
    specialInstructions: String,
    assignedBy: String, // Role of person who assigned (admin/warehouse)
    assignedDate: Date,
    scheduledDate: Date,
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    deliveredAt: Date,
    lastUpdated: Date,
    trackingNumber: {
        type: String,
        unique: true
    },
    deliveryNotes: String,
    proofOfDelivery: {
        signature: String, // Base64 encoded signature
        photo: String,     // Photo URL
        receivedBy: String
    },
    attempts: [{
        attemptDate: Date,
        status: String,
        notes: String
    }]
}, {
    timestamps: true
});

// Indexes
deliverySchema.index({ orderId: 1 });
deliverySchema.index({ driverId: 1, status: 1 });
deliverySchema.index({ trackingNumber: 1 });

const Delivery = mongoose.model('Delivery', deliverySchema);

export default Delivery;
