const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

async function addNewAdminUser() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Admin user data - CUSTOMIZE THIS
        const newAdminData = {
            username: 'youradmin',           // ← Change this username
            email: 'your-email@gmail.com',   // ← Change this to your email
            password: 'admin123',            // ← Change this password
            fullName: 'Your Full Name',      // ← Change this name
            phone: '+94712345678',           // ← Change this phone
            role: 'admin',
            isActive: true,
            isApproved: true,
            emailVerified: true,
            approvedAt: new Date(),
            address: {
                street: 'Your Address',
                city: 'Your City',
                state: 'Your State',
                zipCode: '12345',
                country: 'Sri Lanka'
            },
            preferences: {
                emailNotifications: true,
                smsNotifications: false,
                theme: 'light',
                language: 'en'
            }
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({
            $or: [
                { email: newAdminData.email },
                { username: newAdminData.username }
            ]
        });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists:');
            console.log('   Email:', existingAdmin.email);
            console.log('   Username:', existingAdmin.username);
            console.log('   Role:', existingAdmin.role);

            console.log('\\n🔧 Updating existing admin...');
            existingAdmin.isActive = true;
            existingAdmin.isApproved = true;
            existingAdmin.emailVerified = true;
            existingAdmin.fullName = newAdminData.fullName;
            existingAdmin.phone = newAdminData.phone;
            await existingAdmin.save();

            console.log('✅ Existing admin updated successfully!');
            return;
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        newAdminData.password = await bcrypt.hash(newAdminData.password, saltRounds);

        // Create new admin user
        const adminUser = new User(newAdminData);
        await adminUser.save();

        console.log('🎉 New admin user created successfully!');
        console.log('\\n📋 Admin Login Credentials:');
        console.log('   Email:', newAdminData.email);
        console.log('   Username:', newAdminData.username);
        console.log('   Password: admin123'); // Show original password
        console.log('   Role:', adminUser.role);
        console.log('\\n🔐 User Details:');
        console.log('   ID:', adminUser._id);
        console.log('   Full Name:', adminUser.fullName);
        console.log('   Phone:', adminUser.phone);
        console.log('   Active:', adminUser.isActive);
        console.log('   Approved:', adminUser.isApproved);
        console.log('   Email Verified:', adminUser.emailVerified);

        console.log('\\n✅ This admin will now receive:');
        console.log('   📨 New customer registration notifications');
        console.log('   🔔 System alerts and notifications');
        console.log('   📊 Admin dashboard access');
        console.log('   👥 User management permissions');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\\n🔌 Disconnected from MongoDB');
    }
}

addNewAdminUser();
