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

console.log('✅ Admin routes loaded successfully');

module.exports = router;
