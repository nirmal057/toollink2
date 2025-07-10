#!/usr/bin/env node

/**
 * MongoDB Connection Test
 * Tests the MongoDB Atlas connection
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB Atlas connection...');
    console.log('🌐 Connection String:', process.env.MONGODB_URI ? 'Found' : 'Missing');
    
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI not found in environment variables');
      return;
    }

    // Try to connect with a shorter timeout
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });

    console.log('✅ MongoDB Connected Successfully!');
    console.log('📊 Connection Details:');
    console.log('   Host:', conn.connection.host);
    console.log('   Database:', conn.connection.name);
    console.log('   Port:', conn.connection.port);
    console.log('   Ready State:', conn.connection.readyState);

    // Test a simple operation
    const admin = conn.connection.db.admin();
    const result = await admin.ping();
    console.log('🏓 Ping Result:', result);

    console.log('🎉 Connection test successful!');

  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    
    if (error.message.includes('whitelist')) {
      console.log('\n💡 SOLUTION NEEDED:');
      console.log('   1. Go to MongoDB Atlas dashboard');
      console.log('   2. Navigate to Network Access');
      console.log('   3. Add your current IP address to the whitelist');
      console.log('   4. Or add 0.0.0.0/0 for development (less secure)');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 SOLUTION NEEDED:');
      console.log('   1. Check username and password in connection string');
      console.log('   2. Verify database user permissions');
    }
    
    console.log('\n🔧 Current IP Info:');
    console.log('   You may need to whitelist your current IP address');
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testConnection();
