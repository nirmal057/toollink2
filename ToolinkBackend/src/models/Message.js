import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    // Customer Information
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow guest messages
    },
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    customerPhone: {
        type: String,
        trim: true
    },

    // Message Content
    subject: {
        type: String,
        required: true,
        trim: true
    },

    // Message Thread
    messages: [{
        id: {
            type: String,
            default: () => new mongoose.Types.ObjectId().toString()
        },
        content: {
            type: String,
            required: true
        },
        sender: {
            type: String,
            enum: ['customer', 'support', 'admin', 'cashier'],
            required: true
        },
        senderName: {
            type: String,
            required: true
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        isRead: {
            type: Boolean,
            default: false
        }
    }],

    // Status Information
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Metadata
    source: {
        type: String,
        enum: ['customer_portal', 'admin_panel', 'landing_page', 'system'],
        default: 'customer_portal'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isReplied: {
        type: Boolean,
        default: false
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Virtual for last message
messageSchema.virtual('lastMessage').get(function () {
    if (this.messages && this.messages.length > 0) {
        return this.messages[this.messages.length - 1].content;
    }
    return '';
});

// Virtual for unread count
messageSchema.virtual('unreadCount').get(function () {
    if (this.messages) {
        return this.messages.filter(msg => !msg.isRead && msg.sender === 'customer').length;
    }
    return 0;
});

// Update lastMessageAt when messages are added
messageSchema.pre('save', function (next) {
    if (this.messages && this.messages.length > 0) {
        this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
    }
    next();
});

// Ensure virtuals are included in JSON output
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

export default mongoose.model('Message', messageSchema);
