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
import messageRoutes from './src/routes/messages.js';
import driverRoutes from './src/routes/drivers.js';
import sampleDataRoutes from './src/routes/sampleData.js';

// Import middleware
import { authenticateToken } from './src/middleware/auth.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { notFoundHandler } from './src/middleware/notFoundHandler.js';
import { requestLogger } from './src/middleware/requestLogger.js';
import { corsOptions } from './src/config/cors.js';

// Import utilities
import { createDefaultAdmin } from './src/utils/createDefaultAdmin.js';
import { testEmailConnection } from './src/utils/emailService.js';
import logger from './src/utils/logger.js';
import dbConnection from './src/config/database.js';

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 5000; // Server port

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// CORS middleware
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        statusCode: 429,
        timestamp: new Date().toISOString()
    }
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(requestLogger);
app.use(morgan('combined'));

// Database connection status middleware
app.use('/api', (req, res, next) => {
    const dbStatus = dbConnection.getStatus();

    if (!dbStatus.isConnected) {
        logger.warn(`API request blocked - Database ${dbStatus.status}`);
        return res.status(503).json({
            success: false,
            error: 'Database connection unavailable. Please try again in a few moments.',
            errorType: 'DATABASE_UNAVAILABLE',
            status: dbStatus.status,
            timestamp: new Date().toISOString()
        });
    }

    next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Documentation route
app.get('/api/docs', (req, res) => {
    res.json({
        message: 'ToolLink API Documentation',
        version: '2.0.0',
        database: 'New Connection System',
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
            predictions: '/api/predictions',
            messages: '/api/messages',
            drivers: '/api/drivers',
            deliveries: '/api/deliveries',
            sampleData: '/api/sample-data'
        },
        health: {
            server: '/health',
            database: '/health/database'
        },
        documentation: 'See DATABASE_SYSTEM_V2.md for database details'
    });
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbStatus = dbConnection.getStatus();
        const dbTest = await dbConnection.testConnection();

        const isHealthy = dbStatus.isConnected && dbTest.success;

        res.status(isHealthy ? 200 : 503).json({
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: {
                connected: dbStatus.isConnected,
                status: dbStatus.status,
                name: dbStatus.database,
                host: dbStatus.host,
                test: dbTest.success ? 'passed' : 'failed'
            },
            memory: process.memoryUsage(),
            version: process.version
        });
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Database health check endpoint
app.get('/health/database', async (req, res) => {
    try {
        const dbStatus = dbConnection.getStatus();
        const dbTest = await dbConnection.testConnection();

        if (!dbStatus.isConnected) {
            return res.status(503).json({
                status: 'unhealthy',
                database: {
                    connected: false,
                    status: dbStatus.status,
                    error: 'Database not connected'
                },
                timestamp: new Date().toISOString()
            });
        }

        res.status(200).json({
            status: 'healthy',
            database: {
                connected: true,
                status: dbStatus.status,
                name: dbStatus.database,
                host: dbStatus.host,
                test: dbTest
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Database health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            database: {
                connected: false,
                status: 'error',
                error: error.message
            },
            timestamp: new Date().toISOString()
        });
    }
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
app.use('/api/messages', messageRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/deliveries', driverRoutes); // Also mount on /deliveries for convenience
app.use('/api/sample-data', sampleDataRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database connection and start server
const startServer = async () => {
    try {
        logger.info('🚀 Starting ToolLink Backend Server...');

        // Connect to database
        const dbConnected = await dbConnection.connect();

        if (dbConnected) {
            logger.info('✅ Database connection established');

            // Create default admin user
            try {
                await createDefaultAdmin();
                logger.info('✅ Default admin user verified/created');
            } catch (error) {
                logger.warn(`⚠️  Admin user creation warning: ${error.message}`);
            }
        } else {
            logger.warn('⚠️  Server starting without database connection');
        }

        // Start server
        const server = app.listen(PORT, () => {
            logger.info(`🌟 Server successfully started on port ${PORT}`);
            logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`📊 Health Check: http://localhost:${PORT}/health`);
            logger.info(`🗄️  Database Health: http://localhost:${PORT}/health/database`);
            logger.info(`📖 API Documentation: http://localhost:${PORT}/api/docs`);

            if (dbConnected) {
                // Start database monitoring
                dbConnection.startMonitoring();
                logger.info('📈 Database monitoring enabled');
            }
        });

        // Handle server shutdown gracefully
        const gracefulShutdown = (signal) => {
            logger.info(`${signal} received. Shutting down server gracefully...`);
            server.close(async () => {
                logger.info('HTTP server closed');
                await dbConnection.gracefulShutdown(signal);
            });
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', err);
    if (process.env.NODE_ENV === 'production') {
        logger.error('Shutting down due to unhandled promise rejection');
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception thrown:', err);
    if (process.env.NODE_ENV === 'production') {
        logger.error('Shutting down due to uncaught exception');
        process.exit(1);
    }
});

// Start the server
startServer();

export default app;
