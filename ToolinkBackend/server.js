import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './src/routes/auth.js';
import userRoutes from './src/routes/users.js';
import inventoryRoutes from './src/routes/inventory.js';
import orderRoutes from './src/routes/orders.js';
import deliveryRoutes from './src/routes/delivery.js';
import notificationRoutes from './src/routes/notifications.js';
import reportRoutes from './src/routes/reports.js';
import feedbackRoutes from './src/routes/feedback.js';
import activityRoutes from './src/routes/activity.js';
import adminRoutes from './src/routes/admin.js';
import predictionRoutes from './src/routes/predictions.js';

// Import middleware
import { authenticateToken } from './src/middleware/auth.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { notFoundHandler } from './src/middleware/notFoundHandler.js';
import { requestLogger } from './src/middleware/requestLogger.js';
import { corsOptions } from './src/config/cors.js';

// Import utilities
import { createDefaultAdmin } from './src/utils/createDefaultAdmin.js';
import logger from './src/utils/logger.js';

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
}));

// Rate limiting - TEMPORARILY DISABLED FOR DEBUG
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased limit for debugging
    message: 'Too many requests from this IP, please try again later.',
});
// app.use(limiter); // COMMENTED OUT FOR DEBUG

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// CORS configuration
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Documentation route
app.get('/api/docs', (req, res) => {
    res.json({
        message: 'ToolLink API Documentation',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            inventory: '/api/inventory',
            orders: '/api/orders',
            delivery: '/api/delivery',
            notifications: '/api/notifications',
            reports: '/api/reports',
            feedback: '/api/feedback',
            activity: '/api/activity',
            admin: '/api/admin',
            predictions: '/api/predictions'
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/predictions', predictionRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        logger.info('Connected to MongoDB Atlas successfully');

        // Create default admin user
        await createDefaultAdmin();

        // Start server
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
        });
    })
    .catch((error) => {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception thrown:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    mongoose.connection.close(() => {
        logger.info('Database connection closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    mongoose.connection.close(() => {
        logger.info('Database connection closed');
        process.exit(0);
    });
});

export default app;
