import express from 'express';
import { authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Mock delivery data for now
const mockDeliveries = [
    {
        id: '1',
        orderId: 'ORD-001',
        customer: 'John Doe',
        address: '123 Main St, City, State 12345',
        status: 'pending',
        scheduledDate: '2024-01-15',
        driver: null,
        items: ['Tool A', 'Tool B'],
        priority: 'medium'
    },
    {
        id: '2',
        orderId: 'ORD-002',
        customer: 'Jane Smith',
        address: '456 Oak Ave, City, State 12346',
        status: 'in_transit',
        scheduledDate: '2024-01-14',
        driver: 'Mike Driver',
        items: ['Tool C'],
        priority: 'high'
    }
];

// Get all deliveries
router.get('/', authorize('admin', 'warehouse', 'cashier', 'driver'), async (req, res) => {
    try {
        const { status, date, driver } = req.query;

        let filteredDeliveries = mockDeliveries;

        if (status) {
            filteredDeliveries = filteredDeliveries.filter(d => d.status === status);
        }

        if (date) {
            filteredDeliveries = filteredDeliveries.filter(d => d.scheduledDate === date);
        }

        if (driver) {
            filteredDeliveries = filteredDeliveries.filter(d => d.driver === driver);
        }

        res.json({
            success: true,
            data: filteredDeliveries,
            count: filteredDeliveries.length
        });
    } catch (error) {
        logger.error('Get deliveries error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch deliveries',
            errorType: 'FETCH_DELIVERIES_ERROR'
        });
    }
});

// Get delivery statistics
router.get('/stats', authorize('admin', 'warehouse', 'cashier'), async (req, res) => {
    try {
        const stats = {
            totalDeliveries: mockDeliveries.length,
            pending: mockDeliveries.filter(d => d.status === 'pending').length,
            inTransit: mockDeliveries.filter(d => d.status === 'in_transit').length,
            delivered: mockDeliveries.filter(d => d.status === 'delivered').length,
            cancelled: mockDeliveries.filter(d => d.status === 'cancelled').length
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Get delivery statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch delivery statistics',
            errorType: 'FETCH_STATS_ERROR'
        });
    }
});

// Get single delivery
router.get('/:id', authorize('admin', 'warehouse', 'cashier', 'driver'), async (req, res) => {
    try {
        const delivery = mockDeliveries.find(d => d.id === req.params.id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                error: 'Delivery not found',
                errorType: 'DELIVERY_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: delivery
        });
    } catch (error) {
        logger.error('Get delivery error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch delivery',
            errorType: 'FETCH_DELIVERY_ERROR'
        });
    }
});

// Create delivery
router.post('/', authorize('admin', 'warehouse', 'cashier'), async (req, res) => {
    try {
        const newDelivery = {
            id: String(mockDeliveries.length + 1),
            ...req.body,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        mockDeliveries.push(newDelivery);

        logger.info(`Delivery created: ${newDelivery.id} by ${req.user.fullName}`);

        res.status(201).json({
            success: true,
            message: 'Delivery created successfully',
            data: newDelivery
        });
    } catch (error) {
        logger.error('Create delivery error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create delivery',
            errorType: 'CREATE_DELIVERY_ERROR'
        });
    }
});

// Update delivery
router.put('/:id', authorize('admin', 'warehouse', 'cashier', 'driver'), async (req, res) => {
    try {
        const deliveryIndex = mockDeliveries.findIndex(d => d.id === req.params.id);

        if (deliveryIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Delivery not found',
                errorType: 'DELIVERY_NOT_FOUND'
            });
        }

        mockDeliveries[deliveryIndex] = {
            ...mockDeliveries[deliveryIndex],
            ...req.body,
            updatedAt: new Date().toISOString()
        };

        logger.info(`Delivery updated: ${req.params.id} by ${req.user.fullName}`);

        res.json({
            success: true,
            message: 'Delivery updated successfully',
            data: mockDeliveries[deliveryIndex]
        });
    } catch (error) {
        logger.error('Update delivery error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update delivery',
            errorType: 'UPDATE_DELIVERY_ERROR'
        });
    }
});

// Update delivery status
router.patch('/:id/status', authorize('admin', 'warehouse', 'cashier', 'driver'), async (req, res) => {
    try {
        const { status } = req.body;
        const deliveryIndex = mockDeliveries.findIndex(d => d.id === req.params.id);

        if (deliveryIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Delivery not found',
                errorType: 'DELIVERY_NOT_FOUND'
            });
        }

        const previousStatus = mockDeliveries[deliveryIndex].status;
        mockDeliveries[deliveryIndex].status = status;
        mockDeliveries[deliveryIndex].updatedAt = new Date().toISOString();

        logger.info(`Delivery status updated: ${req.params.id} from ${previousStatus} to ${status} by ${req.user.fullName}`);

        res.json({
            success: true,
            message: 'Delivery status updated successfully',
            data: {
                id: req.params.id,
                previousStatus,
                currentStatus: status,
                updatedAt: mockDeliveries[deliveryIndex].updatedAt
            }
        });
    } catch (error) {
        logger.error('Update delivery status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update delivery status',
            errorType: 'UPDATE_STATUS_ERROR'
        });
    }
});

// Assign driver to delivery
router.patch('/:id/assign-driver', authorize('admin', 'warehouse', 'cashier'), async (req, res) => {
    try {
        const { driverId } = req.body;
        const deliveryIndex = mockDeliveries.findIndex(d => d.id === req.params.id);

        if (deliveryIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Delivery not found',
                errorType: 'DELIVERY_NOT_FOUND'
            });
        }

        mockDeliveries[deliveryIndex].driver = driverId;
        mockDeliveries[deliveryIndex].updatedAt = new Date().toISOString();

        logger.info(`Driver assigned to delivery: ${req.params.id} by ${req.user.fullName}`);

        res.json({
            success: true,
            message: 'Driver assigned successfully',
            data: mockDeliveries[deliveryIndex]
        });
    } catch (error) {
        logger.error('Assign driver error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to assign driver',
            errorType: 'ASSIGN_DRIVER_ERROR'
        });
    }
});

export default router;
