import mongoose from 'mongoose';
import User from './src/models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const clearAllUsersAndCreateAdmin = async () => {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB Atlas successfully');

        // Delete ALL users from the database
        console.log('\n🗑️  Removing all existing users...');
        const deleteResult = await User.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.deletedCount} users from the database`);

        // Create a new admin user that you can log in with
        console.log('\n👤 Creating new admin user...');

        const adminUserData = {
            username: 'admin',
            email: 'admin@toollink.com',
            password: 'admin123', // This will be automatically hashed by the User model
            fullName: 'System Administrator',
            role: 'admin',
            isActive: true,
            isApproved: true,
            emailVerified: true,
            phone: '+1234567890',
            address: {
                street: '123 Admin Street',
                city: 'Admin City',
                state: 'Admin State',
                country: 'Sri Lanka',
                zipCode: '12345'
            },
            preferences: {
                theme: 'light',
                language: 'en',
                notifications: true,
                emailNotifications: true,
                smsNotifications: false
            },
            notes: 'Default admin user created for system access'
        };

        // Don't hash the password manually - let the User model do it
        // Create the admin user
        const adminUser = new User(adminUserData);
        await adminUser.save();

        console.log('✅ Admin user created successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('   Email: admin@toollink.com');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('   Role: admin');

        // Verify the user was created
        const userCount = await User.countDocuments();
        console.log(`\n📊 Total users in database: ${userCount}`);

        // Test login functionality
        console.log('\n🔐 Testing login functionality...');
        const testUser = await User.findByEmailOrUsername('admin@toollink.com');
        if (testUser) {
            const isPasswordValid = await testUser.comparePassword('admin123');
            console.log(`✅ User found: ${testUser.email}`);
            console.log(`✅ Password validation: ${isPasswordValid ? 'PASSED' : 'FAILED'}`);
            console.log(`✅ User is active: ${testUser.isActive}`);
            console.log(`✅ User is approved: ${testUser.isApproved}`);
            console.log(`✅ Email verified: ${testUser.emailVerified}`);
        } else {
            console.log('❌ Test user not found');
        }

        console.log('\n🎉 Database reset complete! You can now log in with the admin credentials above.');

    } catch (error) {
        console.error('❌ Error during database reset:', error);
        if (error.code === 11000) {
            console.error('   Duplicate key error - user might already exist');
        }
    } finally {
        // Close the MongoDB connection
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the script
clearAllUsersAndCreateAdmin();
