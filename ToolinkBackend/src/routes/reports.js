import express from 'express';
import { authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get all reports
router.get('/', authorize('admin', 'warehouse', 'cashier'), async (req, res) => {
    try {
        const mockReports = [
            {
                id: '1',
                title: 'Monthly Sales Report',
                type: 'sales',
                period: '2024-01',
                data: { totalSales: 25000, orders: 150, customers: 45 },
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                title: 'Inventory Status Report',
                type: 'inventory',
                period: '2024-01',
                data: { totalItems: 500, lowStock: 15, outOfStock: 3 },
                createdAt: new Date().toISOString()
            }
        ];

        res.json({
            success: true,
            data: mockReports
        });
    } catch (error) {
        logger.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reports',
            errorType: 'FETCH_REPORTS_ERROR'
        });
    }
});

export default router;
