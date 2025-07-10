#!/usr/bin/env node

/**
 * List All Users Script
 * Shows all users in the database with their roles and status
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function listAllUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({}).select('username email role isActive isApproved emailVerified createdAt').sort({ createdAt: -1 });

    if (users.length === 0) {
      console.log('📭 No users found in the database');
      return;
    }

    console.log(`👥 Found ${users.length} user(s):`);
    console.log('='.repeat(80));

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.username} (${user.role.toUpperCase()})`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   📊 Status: ${user.isActive ? '🟢 Active' : '🔴 Inactive'} | ${user.isApproved ? '✅ Approved' : '⏳ Pending'} | ${user.emailVerified ? '📧 Verified' : '📧 Unverified'}`);
      console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()} ${user.createdAt.toLocaleTimeString()}`);
      console.log(`   🆔 ID: ${user._id}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`📊 Summary: ${users.length} total users`);
    
    const roleCount = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    console.log('👤 By Role:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });

    const activeCount = users.filter(u => u.isActive).length;
    const approvedCount = users.filter(u => u.isApproved).length;
    const verifiedCount = users.filter(u => u.emailVerified).length;

    console.log('\n📈 Statistics:');
    console.log(`   Active: ${activeCount}/${users.length}`);
    console.log(`   Approved: ${approvedCount}/${users.length}`);
    console.log(`   Email Verified: ${verifiedCount}/${users.length}`);

  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
listAllUsers();
