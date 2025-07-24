import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'user_created', 'user_updated', 'user_deleted', 'user_login', 'user_logout',
            'inventory_created', 'inventory_updated', 'inventory_deleted',
            'order_created', 'order_updated', 'order_deleted', 'order_status_changed',
            'role_assigned', 'role_removed', 'permission_granted', 'permission_revoked',
            'system_config_updated', 'backup_created', 'data_export', 'data_import',
            'password_changed', 'password_reset', 'account_locked', 'account_unlocked'
        ]
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetId: {
        type: String, // Can be ObjectId or any identifier for the target resource
        required: false
    },
    targetType: {
        type: String,
        enum: ['user', 'inventory', 'order', 'role', 'system', 'auth'],
        required: false
    },
    details: {
        type: mongoose.Schema.Types.Mixed, // Flexible object for additional details
        default: {}
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['success', 'failure', 'warning'],
        default: 'success'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

// Static method to create audit log entry
auditLogSchema.statics.createLog = async function (logData) {
    try {
        const log = new this(logData);
        await log.save();
        return log;
    } catch (error) {
        console.error('Error creating audit log:', error);
        throw error;
    }
};

// Static method to get paginated logs with filters
auditLogSchema.statics.getPaginatedLogs = async function (options = {}) {
    const {
        page = 1,
        limit = 50,
        action,
        userId,
        targetType,
        startDate,
        endDate,
        status
    } = options;

    // Build filter object
    const filter = {};

    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (targetType) filter.targetType = targetType;
    if (status) filter.status = status;

    if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with population
    const [logs, total] = await Promise.all([
        this.find(filter)
            .populate('userId', 'name email role')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        this.countDocuments(filter)
    ]);

    return {
        logs,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

// Static method to get audit statistics
auditLogSchema.statics.getStatistics = async function (timeRange = '30d') {
    const now = new Date();
    let startDate;

    switch (timeRange) {
        case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [actionStats, userStats, dailyStats] = await Promise.all([
        // Action statistics
        this.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),

        // Top users by activity
        this.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            { $group: { _id: '$userId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    userId: '$_id',
                    userName: '$user.name',
                    userEmail: '$user.email',
                    count: 1
                }
            }
        ]),

        // Daily activity for the last 30 days
        this.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ])
    ]);

    return {
        totalLogs: await this.countDocuments({ timestamp: { $gte: startDate } }),
        actionBreakdown: actionStats,
        topUsers: userStats,
        dailyActivity: dailyStats,
        timeRange
    };
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
