const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout for faster feedback
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Log connection status
    mongoose.connection.on('connected', () => {
      console.log('🟢 Mongoose connected to MongoDB Atlas');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🔴 Mongoose disconnected from MongoDB Atlas');
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('authentication failed')) {
      console.error('🔑 Authentication failed. Please check your username and password.');
    } else if (error.message.includes('Network timeout')) {
      console.error('🌐 Network timeout. Please check your internet connection.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🌐 DNS resolution failed. Please check your connection string.');
    } else if (error.message.includes('whitelist') || error.message.includes('IP')) {
      console.error('🔒 IP Address not whitelisted in MongoDB Atlas.');
      console.error('');
      console.error('💡 QUICK FIX:');
      console.error('   1. Go to https://cloud.mongodb.com/');
      console.error('   2. Select your project');
      console.error('   3. Go to "Network Access" in the left sidebar');
      console.error('   4. Click "Add IP Address"');
      console.error('   5. Click "Allow Access from Anywhere" (0.0.0.0/0) for development');
      console.error('   6. Or add your current IP address specifically');
      console.error('   7. Wait 1-2 minutes for changes to take effect');
      console.error('');
      console.error('⚠️  For production, use specific IP addresses instead of 0.0.0.0/0');
    }
    
    console.error('');
    console.error('🔧 Backend will continue running but database features will be limited.');
    console.error('   You can still test the API endpoints, but data won\'t persist.');
    
    // Don't exit the process, let the server continue running
    // This allows frontend testing even without database
    return null;
  }
};

// Test connection function
const testConnection = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    console.log('🏓 MongoDB Atlas ping successful');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Atlas ping failed:', error.message);
    return false;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Gracefully shutting down...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed.');
  process.exit(0);
});

module.exports = { connectDB, testConnection };
