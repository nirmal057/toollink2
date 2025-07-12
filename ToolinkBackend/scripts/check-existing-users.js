/**
 * Check existing users in database
 */

import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkExistingUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const users = await User.find({ isActive: true })
            .select('fullName username email role createdAt')
            .sort({ role: 1, fullName: 1 });

        console.log('📋 CURRENT USERS IN DATABASE:\n');

        const roleGroups = {};
        users.forEach(user => {
            if (!roleGroups[user.role]) {
                roleGroups[user.role] = [];
            }
            roleGroups[user.role].push(user);
        });

        Object.keys(roleGroups).sort().forEach(role => {
            console.log(`🎯 ${role.toUpperCase()} (${roleGroups[role].length} users):`);
            roleGroups[role].forEach(user => {
                console.log(`   • ${user.fullName}`);
                console.log(`     Email: ${user.email}`);
                console.log(`     Username: ${user.username}`);
                console.log('');
            });
        });

        console.log('\n🔑 LOGIN CREDENTIALS:');
        console.log('You can login with these emails and password pattern:');
        console.log('• admin@toollink.com (password: admin123)');
        console.log('• warehouse@toollink.com (password: warehouse123)');
        console.log('• cashier@toollink.com (password: cashier123)');
        console.log('• customer@toollink.com (password: customer123)');
        console.log('• Or any other email shown above with [role]123 password pattern');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkExistingUsers();
