import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['demand_forecast', 'stock_prediction', 'sales_trend', 'customer_behavior'],
        required: true
    },
    entityId: String, // ID of the entity being predicted (product, user, etc.)
    inputData: mongoose.Schema.Types.Mixed,
    prediction: mongoose.Schema.Types.Mixed,
    confidence: {
        type: Number,
        min: 0,
        max: 1
    },
    algorithm: String,
    version: String,
    validUntil: Date,
    accuracy: Number, // Actual vs predicted accuracy (if available)
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

// Indexes
predictionSchema.index({ type: 1, entityId: 1 });
predictionSchema.index({ validUntil: 1 });

const Prediction = mongoose.model('Prediction', predictionSchema);

export default Prediction;
