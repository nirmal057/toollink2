const express = require('express');

console.log('📊 Loading analytics routes...');

const router = express.Router();

// Dashboard analytics route
router.get('/dashboard', (req, res) => {
    console.log('📈 Analytics dashboard route hit');
    res.json({
        success: true,
        analytics: {
            sales: {
                total: 15000,
                thisMonth: 3500,
                lastMonth: 4200,
                growth: -16.7
            },
            orders: {
                total: 150,
                pending: 12,
                completed: 120,
                cancelled: 18
            },
            customers: {
                total: 45,
                active: 32,
                new: 8
            },
            inventory: {
                totalProducts: 200,
                lowStock: 15,
                outOfStock: 3
            },
            revenue: {
                daily: [1200, 1500, 800, 2100, 1800, 2200, 1900],
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            }
        }
    });
});

// Additional analytics endpoints
router.get('/sales', (req, res) => {
    console.log('💰 Sales analytics route hit');
    res.json({
        success: true,
        sales: {
            total: 15000,
            thisMonth: 3500,
            lastMonth: 4200,
            growth: -16.7,
            breakdown: {
                products: 12000,
                services: 3000
            }
        }
    });
});

router.get('/orders', (req, res) => {
    console.log('📦 Orders analytics route hit');
    res.json({
        success: true,
        orders: {
            total: 150,
            pending: 12,
            processing: 8,
            completed: 120,
            cancelled: 18,
            trends: {
                daily: [5, 8, 3, 12, 7, 9, 6],
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            }
        }
    });
});

console.log('✅ Analytics routes loaded successfully');

module.exports = router;
