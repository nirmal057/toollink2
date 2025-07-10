#!/usr/bin/env node

/**
 * Remove Admin User and Create New One
 * This script removes the old admin and creates a new one with correct email
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function replaceAdminUser() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Remove existing admin users
    const deleteResult = await User.deleteMany({ 
      $or: [
        { email: 'admin@toollink.lk' },
        { email: 'admin@toollink.com' },
        { username: 'admin' }
      ]
    });

    console.log(`🗑️  Removed ${deleteResult.deletedCount} existing admin user(s)`);

    // Create new admin user with correct email
    const adminData = {
      username: 'admin',
      email: 'admin@toollink.com',
      password: 'admin123',
      fullName: 'System Administrator',
      phone: '+94112345678',
      role: 'admin',
      isActive: true,
      isApproved: true,
      emailVerified: true,
      approvedAt: new Date(),
      address: {
        street: 'Main Office',
        city: 'Colombo',
        state: 'Western',
        zipCode: '00100',
        country: 'Sri Lanka'
      },
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        theme: 'dark',
        language: 'en'
      }
    };

    const adminUser = new User(adminData);
    await adminUser.save();

    console.log('🎉 New admin user created successfully!');
    console.log('');
    console.log('📋 Admin Login Credentials:');
    console.log('   Email: admin@toollink.com');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('✅ This email matches the frontend expectations!');
    console.log('');
    console.log('🔐 User Details:');
    console.log('   ID:', adminUser._id);
    console.log('   Role:', adminUser.role);
    console.log('   Active:', adminUser.isActive);
    console.log('   Approved:', adminUser.isApproved);
    console.log('   Email Verified:', adminUser.emailVerified);

  } catch (error) {
    console.error('❌ Error replacing admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
replaceAdminUser();
