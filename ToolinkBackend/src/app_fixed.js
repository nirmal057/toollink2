const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Configure dotenv to look for .env file in the parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { connectDB, testConnection } = require('./config/mongodb');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const frontendUrls = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: frontendUrls,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'Connected' : 'Disconnected',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database connection test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    
    const states = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };

    res.json({
      status: 'OK',
      database: {
        state: states[dbState],
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        port: mongoose.connection.port
      },
      connection: process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Not configured'
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: error.message
    });
  }
});

// Basic API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'ToolLink Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      database: '/api/db-test'
    }
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/notifications', require('./routes/notifications'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

// Start server function
const startServer = async () => {
  try {
    // Try to connect to MongoDB first
    const dbConnection = await connectDB();
    
    if (dbConnection) {
      console.log('✅ Database connected successfully');
    } else {
      console.log('⚠️  Database connection failed - running in limited mode');
    }
    
    // Start the server regardless of database connection
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Frontend URLs: ${frontendUrls.join(', ')}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Database Test: http://localhost:${PORT}/api/db-test`);
      
      if (!dbConnection) {
        console.log('');
        console.log('⚠️  NOTICE: Database not connected');
        console.log('   - API endpoints will return mock data or errors');
        console.log('   - Fix MongoDB connection to enable full functionality');
        console.log('   - Check the MongoDB Atlas IP whitelist settings');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
