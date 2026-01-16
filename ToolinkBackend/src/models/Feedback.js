import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    type: {
        type: String,
        enum: ['product', 'service', 'delivery', 'general', 'complaint', 'suggestion'],
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    subject: {
        type: String,
        required: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        maxlength: 2000
    },
    status: {
        type: String,
        enum: ['pending', 'in_review', 'resolved', 'closed'],
        default: 'pending'
    },
    response: {
        message: String,
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        respondedAt: Date
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    category: String,
    attachments: [String] // File URLs
}, {
    timestamps: true
});

// Indexes
feedbackSchema.index({ userId: 1, type: 1 });
feedbackSchema.index({ status: 1, priority: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
