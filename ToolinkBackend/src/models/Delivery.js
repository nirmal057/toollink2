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
        enum: ['scheduled', 'in_transit', 'delivered', 'failed', 'cancelled'],
        default: 'scheduled'
    },
    scheduledDate: Date,
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    trackingNumber: {
        type: String,
        unique: true
    },
    deliveryAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
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
