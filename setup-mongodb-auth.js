#!/usr/bin/env node

/**
 * MongoDB Atlas Test User Creator
 * Creates test users in your MongoDB Atlas database
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI;

async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Import User model
const User = require('./src/models/mongo/User');

async function createTestUsers() {
  try {
    console.log('🔧 Creating test users in MongoDB Atlas...\n');

    // Check if test users already exist
    const existingAdmin = await User.findOne({ email: 'admin@toollink.com' });
    const existingUser = await User.findOne({ email: 'user@toollink.com' });

    if (existingAdmin && existingUser) {
      console.log('✅ Test users already exist in database');
      console.log('📧 Admin: admin@toollink.com / admin123');
      console.log('📧 User: user@toollink.com / user123');
      return;
    }

    // Create admin user
    if (!existingAdmin) {
      const adminUser = new User({
        username: 'admin',
        email: 'admin@toollink.com',
        password: 'admin123', // Will be hashed automatically
        fullName: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        phone: '+1234567890',
        isActive: true,
        isApproved: true
      });

      await adminUser.save();
      console.log('✅ Admin user created');
    }

    // Create regular user
    if (!existingUser) {
      const regularUser = new User({
        username: 'user',
        email: 'user@toollink.com',
        password: 'user123', // Will be hashed automatically
        fullName: 'Regular User',
        firstName: 'Regular',
        lastName: 'User',
        role: 'customer',
        phone: '+1234567891',
        isActive: true,
        isApproved: true
      });

      await regularUser.save();
      console.log('✅ Regular user created');
    }

    // Create test user for attempt tracking
    const existingTest = await User.findOne({ email: 'test@toollink.com' });
    if (!existingTest) {
      const testUser = new User({
        username: 'test',
        email: 'test@toollink.com',
        password: 'test123',
        fullName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        phone: '+1234567892',
        isActive: true,
        isApproved: true
      });

      await testUser.save();
      console.log('✅ Test user created');
    }

    console.log('\n🎯 Test Credentials:');
    console.log('👑 Admin: admin@toollink.com / admin123');
    console.log('👤 User: user@toollink.com / user123');
    console.log('🧪 Test: test@toollink.com / test123');

  } catch (error) {
    console.error('❌ Error creating users:', error.message);
  }
}

async function testAuthentication() {
  console.log('\n🧪 Testing MongoDB Authentication API...\n');

  try {
    const fetch = (await import('node-fetch')).default;
    
    // Test 1: Valid login
    console.log('1️⃣ Testing valid login...');
    const loginResponse = await fetch('http://localhost:5001/api/auth-enhanced/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@toollink.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginData.success) {
      console.log('✅ Valid login successful');
      console.log('🔑 Token received:', loginData.accessToken.substring(0, 20) + '...');
    } else {
      console.log('❌ Valid login failed:', loginData.message);
    }

    // Test 2: Invalid login
    console.log('\n2️⃣ Testing invalid login...');
    const invalidResponse = await fetch('http://localhost:5001/api/auth-enhanced/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'wrong@example.com',
        password: 'wrongpass'
      })
    });

    const invalidData = await invalidResponse.json();
    
    if (!invalidData.success && invalidData.errorType === 'INVALID_CREDENTIALS') {
      console.log('✅ Invalid login properly rejected');
      console.log('📋 Error message:', invalidData.message);
    } else {
      console.log('❌ Invalid login test failed');
    }

    // Test 3: Forgot password
    console.log('\n3️⃣ Testing forgot password...');
    const forgotResponse = await fetch('http://localhost:5001/api/auth-enhanced/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@toollink.com'
      })
    });

    const forgotData = await forgotResponse.json();
    
    if (forgotData.success) {
      console.log('✅ Forgot password working');
      console.log('🔑 Reset token generated');
    } else {
      console.log('❌ Forgot password failed');
    }

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('💡 Make sure the MongoDB backend is running on port 5001');
  }
}

async function main() {
  console.log('🚀 MongoDB Atlas Authentication Setup\n');
  
  const connected = await connectToMongoDB();
  if (!connected) {
    console.log('💡 Check your MongoDB Atlas connection string in .env file');
    return;
  }
  
  await createTestUsers();
  await testAuthentication();
  
  console.log('\n🎉 MongoDB Atlas Authentication Setup Complete!');
  console.log('🌐 Frontend: http://localhost:5175/login');
  console.log('⚡ Backend: http://localhost:5001/api/auth-enhanced/login');
  
  mongoose.disconnect();
}

if (require.main === module) {
  main().catch(console.error);
}
