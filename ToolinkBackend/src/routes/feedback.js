import express from 'express';
import { authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Mock feedback data
const mockFeedback = [
    {
        id: '1',
        userId: 'user123',
        type: 'suggestion',
        subject: 'Feature Request',
        message: 'Would love to see bulk import for inventory',
        status: 'pending',
        rating: 4,
        createdAt: new Date().toISOString()
    }
];

// Get all feedback
router.get('/', authorize('admin', 'warehouse', 'cashier'), async (req, res) => {
    try {
        res.json({
            success: true,
            data: mockFeedback
        });
    } catch (error) {
        logger.error('Get feedback error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch feedback',
            errorType: 'FETCH_FEEDBACK_ERROR'
        });
    }
});

// Create feedback
router.post('/', async (req, res) => {
    try {
        const newFeedback = {
            id: String(mockFeedback.length + 1),
            userId: req.user._id,
            ...req.body,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        mockFeedback.push(newFeedback);

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: newFeedback
        });
    } catch (error) {
        logger.error('Create feedback error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit feedback',
            errorType: 'CREATE_FEEDBACK_ERROR'
        });
    }
});

export default router;
