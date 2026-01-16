import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';

const router = express.Router();

// Simple dashboard without authentication for testing
router.get('/dashboard-simple', async (req, res) => {
    try {
        console.log('Dashboard endpoint hit');

        // Try to get basic stats
        const userCount = await User.countDocuments();
        const orderCount = await Order.countDocuments();
        const inventoryCount = await Inventory.countDocuments();

        console.log('Counts retrieved:', { userCount, orderCount, inventoryCount });

        const dashboardData = {
            users: { total: userCount },
            orders: { total: orderCount },
            inventory: { total: inventoryCount },
            systemInfo: {
                uptime: process.uptime(),
                nodeVersion: process.version,
                platform: process.platform,
                timestamp: new Date().toISOString()
            }
        };

        res.json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Simple reports endpoint
router.get('/reports-simple', async (req, res) => {
    try {
        console.log('Reports endpoint hit');

        const reports = {
            summary: {
                users: { total: await User.countDocuments() },
                orders: { total: await Order.countDocuments() },
                inventory: { total: await Inventory.countDocuments() },
                generatedAt: new Date().toISOString()
            }
        };

        res.json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
