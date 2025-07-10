#!/usr/bin/env node

/**
 * Create Admin User Script for ToolLink Backend
 * This script creates an admin user in the database
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function createAdminUser() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@toollink.com' },
        { email: 'admin@toollink.lk' },
        { username: 'admin' }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Username:', existingAdmin.username);
      console.log('   Role:', existingAdmin.role);
      console.log('   Active:', existingAdmin.isActive);
      console.log('   Approved:', existingAdmin.isApproved);
      
      // Update existing admin if needed
      if (!existingAdmin.isActive || !existingAdmin.isApproved) {
        existingAdmin.isActive = true;
        existingAdmin.isApproved = true;
        existingAdmin.emailVerified = true;
        await existingAdmin.save();
        console.log('✅ Updated existing admin user status');
      }
      
      process.exit(0);
    }

    // Create new admin user
    const adminData = {
      username: 'admin',
      email: 'admin@toollink.com',
      password: 'admin123', // Default password - should be changed after first login
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

    console.log('🎉 Admin user created successfully!');
    console.log('');
    console.log('📋 Admin Login Credentials:');
    console.log('   Email: admin@toollink.com');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANT: Please change the default password after first login!');
    console.log('');
    console.log('🔐 User Details:');
    console.log('   ID:', adminUser._id);
    console.log('   Role:', adminUser.role);
    console.log('   Active:', adminUser.isActive);
    console.log('   Approved:', adminUser.isApproved);
    console.log('   Email Verified:', adminUser.emailVerified);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.code === 11000) {
      console.log('💡 This error usually means the user already exists.');
      console.log('   Try using different email or username.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createAdminUser();
