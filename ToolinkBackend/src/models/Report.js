import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['inventory', 'sales', 'orders', 'users', 'financial', 'delivery', 'custom'],
        required: true
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parameters: mongoose.Schema.Types.Mixed, // Report filters and parameters
    data: mongoose.Schema.Types.Mixed,       // Report results
    format: {
        type: String,
        enum: ['json', 'pdf', 'excel', 'csv'],
        default: 'json'
    },
    fileUrl: String, // If report is saved as file
    status: {
        type: String,
        enum: ['generating', 'completed', 'failed'],
        default: 'generating'
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
}, {
    timestamps: true
});

// Indexes
reportSchema.index({ generatedBy: 1, type: 1 });
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Report = mongoose.model('Report', reportSchema);

export default Report;
