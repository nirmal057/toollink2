import express from 'express';
import { authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get material predictions
router.get('/', authorize('admin', 'warehouse'), async (req, res) => {
    try {
        const mockPredictions = [
            {
                id: '1',
                itemName: 'Tool A',
                currentStock: 25,
                predictedUsage: 15,
                recommendedOrder: 30,
                confidence: 85,
                timeframe: '30 days',
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                itemName: 'Tool B',
                currentStock: 8,
                predictedUsage: 12,
                recommendedOrder: 25,
                confidence: 78,
                timeframe: '30 days',
                createdAt: new Date().toISOString()
            }
        ];

        res.json({
            success: true,
            data: mockPredictions
        });
    } catch (error) {
        logger.error('Get predictions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch predictions',
            errorType: 'FETCH_PREDICTIONS_ERROR'
        });
    }
});

export default router;
