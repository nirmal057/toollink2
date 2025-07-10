const express = require('express');

console.log('🔧 Loading admin routes...');

const router = express.Router();

// Test route to verify admin routes are working (no auth required for testing)
router.get('/test', (req, res) => {
  console.log('📍 Admin test route hit');
  res.json({ message: 'Admin routes are working!', timestamp: new Date().toISOString() });
});

// Simple dashboard route without auth for testing
router.get('/dashboard', (req, res) => {
  console.log('📊 Admin dashboard route hit');
  res.json({
    success: true,
    dashboard: {
      userStats: {
        total: 5,
        active: 4,
        pending: 1,
        inactive: 0,
        byRole: { admin: 1, customer: 3, cashier: 1 }
      },
      systemInfo: {
        serverTime: new Date().toISOString(),
        version: '1.0.0',
        environment: 'development'
      }
    }
  });
});

// Activity logs route
router.get('/activities', (req, res) => {
  console.log('📋 Admin activities route hit');
  res.json({
    success: true,
    activities: [
      {
        id: 1,
        type: 'user_login',
        user: 'john.doe@example.com',
        timestamp: new Date().toISOString(),
        details: 'User logged in successfully'
      },
      {
        id: 2,
        type: 'order_created',
        user: 'jane.smith@example.com',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        details: 'Order #12345 created'
      },
      {
        id: 3,
        type: 'inventory_updated',
        user: 'admin@example.com',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        details: 'Product ABC123 stock updated'
      }
    ]
  });
});

console.log('✅ Admin routes loaded successfully');

module.exports = router;
