import express from 'express';
import { authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Mock activity data
const mockActivities = [
    {
        id: '1',
        userId: 'user123',
        action: 'login',
        details: { ip: '192.168.1.100', userAgent: 'Mozilla/5.0...' },
        timestamp: new Date().toISOString()
    },
    {
        id: '2',
        userId: 'user123',
        action: 'order_created',
        details: { orderId: 'ORD-001', amount: 150.00 },
        timestamp: new Date().toISOString()
    }
];

// Get user activities
router.get('/', async (req, res) => {
    try {
        const userActivities = mockActivities.filter(a => a.userId === req.user._id.toString());

        res.json({
            success: true,
            data: userActivities
        });
    } catch (error) {
        logger.error('Get activities error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch activities',
            errorType: 'FETCH_ACTIVITIES_ERROR'
        });
    }
});

export default router;
