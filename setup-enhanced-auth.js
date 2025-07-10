#!/usr/bin/env node

/**
 * Quick Start Script for Enhanced Authentication System
 * This script helps you quickly test the enhanced authentication features
 */

const path = require('path');

// Adjust path based on where the script is run from  
const backendPath = path.join(__dirname, 'ToolLink-MySQL-Backend');
const sequelize = require(path.join(backendPath, 'src', 'config', 'database'));

// Use the enhanced Sequelize User model
const UserModel = require(path.join(backendPath, 'src', 'models', 'sequelize', 'User'));
const User = UserModel(sequelize);

async function createTestUser() {
  try {
    console.log('🔧 Setting up test user for enhanced authentication...\n');

    // Check if test user already exists
    const existingUser = await User.findOne({
      where: { email: 'test@example.com' }
    });

    if (existingUser) {
      console.log('✅ Test user already exists');
      console.log('📧 Email: test@example.com');
      console.log('🔑 Password: password123');
      console.log('👤 Role:', existingUser.role);
      return existingUser;
    }

    // Create test user
    const testUser = await User.create({
      email: 'test@example.com',
      password: 'password123', // Will be hashed automatically
      role: 'customer',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      isActive: true
    });

    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: password123');
    console.log('👤 Role:', testUser.role);
    console.log('🆔 User ID:', testUser.id);
    
    return testUser;

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    throw error;
  }
}

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@toollink.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return existingAdmin;
    }

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@toollink.com',
      password: 'admin123',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567891',
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@toollink.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role:', adminUser.role);
    
    return adminUser;

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  }
}

async function testDatabaseConnection() {
  try {
    console.log('📊 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Sync models
    console.log('🔄 Synchronizing database models...');
    await sequelize.sync({ alter: false });
    console.log('✅ Database models synchronized');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n💡 Make sure your database is running and configuration is correct');
    console.log('📁 Check your .env file in ToolLink-MySQL-Backend/');
    return false;
  }
}

async function displayQuickStart() {
  console.log('\n🚀 Enhanced Authentication System - Quick Start Guide\n');
  
  console.log('1️⃣  Start the backend server:');
  console.log('   cd ToolLink-MySQL-Backend');
  console.log('   npm start\n');
  
  console.log('2️⃣  Test the enhanced authentication API:');
  console.log('   node test-enhanced-auth.js\n');
  
  console.log('3️⃣  API Endpoints:');
  console.log('   POST /api/auth-enhanced/login');
  console.log('   POST /api/auth-enhanced/forgot-password');
  console.log('   POST /api/auth-enhanced/reset-password');
  console.log('   POST /api/auth-enhanced/refresh-token\n');
  
  console.log('4️⃣  Test Credentials:');
  console.log('   Email: test@example.com');
  console.log('   Password: password123\n');
  
  console.log('   Admin Email: admin@toollink.com');
  console.log('   Admin Password: admin123\n');
  
  console.log('5️⃣  Features to test:');
  console.log('   ✅ Valid login with JWT token generation');
  console.log('   ✅ Invalid email/password handling');
  console.log('   ✅ Login attempt tracking (3 attempts max)');
  console.log('   ✅ Account locking after failed attempts');
  console.log('   ✅ Forgot password functionality');
  console.log('   ✅ Password reset with secure tokens\n');
  
  console.log('📚 Documentation:');
  console.log('   See ENHANCED_AUTH_SYSTEM_DOCUMENTATION.md for full details\n');
}

async function main() {
  console.log('🎯 Enhanced Authentication System Setup\n');
  
  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    return;
  }
  
  try {
    // Create test users
    await createTestUser();
    console.log('');
    await createAdminUser();
    
    // Display quick start guide
    await displayQuickStart();
    
    console.log('🎉 Setup completed successfully!');
    console.log('💡 You can now start testing the enhanced authentication system.\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createTestUser, createAdminUser };
