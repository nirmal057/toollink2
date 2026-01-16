import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'login', 'logout', 'password_change', 'profile_update',
            'order_created', 'order_updated', 'order_cancelled',
            'inventory_added', 'inventory_updated', 'inventory_deleted',
            'user_created', 'user_updated', 'user_deleted',
            'system_access', 'data_export', 'settings_changed',
            'payment_processed', 'delivery_scheduled'
        ]
    },
    details: {
        entityType: String, // 'order', 'inventory', 'user', etc.
        entityId: String,   // ID of the affected entity
        changes: mongoose.Schema.Types.Mixed, // What was changed
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        ip: String,
        userAgent: String,
        sessionId: String
    },
    result: {
        type: String,
        enum: ['success', 'failure', 'partial'],
        default: 'success'
    },
    errorMessage: String
}, {
    timestamps: true
});

// Indexes
activitySchema.index({ userId: 1, action: 1 });
activitySchema.index({ createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
