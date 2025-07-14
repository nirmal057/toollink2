import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const pendingCustomerSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        default: 'customer',
        enum: ['customer']
    },
    // Additional tracking fields
    submittedAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'processing'],
        default: 'pending'
    },
    notes: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Index for faster queries
pendingCustomerSchema.index({ email: 1 });
pendingCustomerSchema.index({ username: 1 });
pendingCustomerSchema.index({ submittedAt: -1 });
pendingCustomerSchema.index({ status: 1 });

// Pre-save middleware to hash password
pendingCustomerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
pendingCustomerSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        return false;
    }
};

// Static method to find by email or username
pendingCustomerSchema.statics.findByEmailOrUsername = function (identifier) {
    return this.findOne({
        $or: [
            { email: identifier },
            { username: identifier }
        ]
    });
};

// Method to convert pending customer to user data
pendingCustomerSchema.methods.toUserData = function () {
    return {
        username: this.username,
        email: this.email,
        password: this.password, // Already hashed
        fullName: this.fullName,
        phone: this.phone,
        role: this.role,
        isApproved: true,
        isActive: true,
        emailVerified: false,
        loginAttempts: 0,
        refreshTokens: [],
        preferences: {
            language: 'en',
            theme: 'light',
            emailNotifications: true,
            smsNotifications: false
        }
    };
};

// Auto-remove pending customers after 30 days
pendingCustomerSchema.index({ submittedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const PendingCustomer = mongoose.model('PendingCustomer', pendingCustomerSchema);

export default PendingCustomer;
