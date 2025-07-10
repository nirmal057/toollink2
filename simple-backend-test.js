/**
 * Manual Backend Starter with Error Handling
 * This script manually starts the backend with proper error reporting
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

console.log('🚀 Starting simplified backend server...');

// Create Express app
const app = express();

// Basic middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Test route
app.get('/api/health', (req, res) => {
  res.json({
    message: 'ToolLink API is running (Simplified)',
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: 'development',
    port: 5001
  });
});

// MongoDB connection
const connectMongoDB = async () => {
  try {
    const mongoUri = 'mongodb+srv://iit21083:k1zTsck8hslcFiZm@cluster0.q0grz0.mongodb.net/toollink_db?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // Continue without MongoDB for testing
  }
};

// Add basic auth routes for testing
app.post('/api/auth-enhanced/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@toollink.com' && password === 'admin123') {
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: 'test-admin-id',
        email: 'admin@toollink.com',
        fullName: 'Test Admin',
        role: 'admin',
        isActive: true
      },
      accessToken: 'test-token-12345'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Add basic users route for testing
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    users: [
      {
        _id: 'test-user-1',
        fullName: 'Test User 1',
        email: 'test1@example.com',
        role: 'customer',
        status: 'active',
        isActive: true
      },
      {
        _id: 'test-user-2',
        fullName: 'Test User 2',
        email: 'test2@example.com',
        role: 'warehouse',
        status: 'active',
        isActive: true
      }
    ]
  });
});

// Start server
const PORT = 5001;

const startServer = async () => {
  try {
    await connectMongoDB();
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Test login: POST http://localhost:${PORT}/api/auth-enhanced/login`);
      console.log(`👥 Test users: GET http://localhost:${PORT}/api/users`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
