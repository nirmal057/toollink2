const mongoose = require('mongoose');
require('dotenv').config({ path: './ToolLink/backend/.env' });

// Import User model from the correct path
const User = require('./ToolLink/backend/models/User');

async function checkUsers() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        console.log('Connection string:', process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas successfully!');

        // Find all users
        const users = await User.find({});
        console.log(`\n📊 Total users found: ${users.length}`);

        if (users.length === 0) {
            console.log('❌ No users found in the database!');
            return;
        }

        console.log('\n👥 User Details:');
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. User ID: ${user._id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Active: ${user.isActive}`);
            console.log(`   Approved: ${user.isApproved}`);
            console.log(`   Last Login: ${user.lastLogin || 'Never'}`);
            console.log(`   Created: ${user.createdAt}`);
            console.log(`   Password Hash (first 20 chars): ${user.password?.substring(0, 20)}...`);
        });

        // Check specifically for admin user
        const adminUser = await User.findOne({ email: 'admin@toollink.com' });
        if (adminUser) {
            console.log('\n✅ Admin user found!');
            console.log('Admin details:', {
                id: adminUser._id,
                email: adminUser.email,
                name: adminUser.name,
                role: adminUser.role,
                active: adminUser.isActive,
                approved: adminUser.isApproved,
                hasPassword: !!adminUser.password,
                passwordLength: adminUser.password?.length
            });
        } else {
            console.log('\n❌ Admin user (admin@toollink.com) not found!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Connection closed');
    }
}

checkUsers();
