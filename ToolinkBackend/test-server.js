import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { config } from 'dotenv';
import adminSimpleRoutes from './src/routes/admin-simple.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 5005;

// Basic middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Add admin routes
app.use('/api/admin', adminSimpleRoutes);

// Simple admin dashboard test
app.get('/api/admin/dashboard-test', (req, res) => {
    res.json({
        success: true,
        data: {
            users: { total: 1, active: 1 },
            orders: { total: 0, pending: 0 },
            inventory: { total: 0, lowStock: 0 },
            systemInfo: {
                uptime: process.uptime(),
                nodeVersion: process.version,
                platform: process.platform
            }
        }
    });
});

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB successfully');

        app.listen(PORT, () => {
            console.log(`Test server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
            console.log(`Dashboard test: http://localhost:${PORT}/api/admin/dashboard-test`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });
