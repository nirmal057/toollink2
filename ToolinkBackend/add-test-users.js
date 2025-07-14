import mongoose from 'mongoose';
import User from './src/models/User.js';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/toollink';

async function addTestUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to toollink database');

        // Test users to add
        const testUsers = [
            {
                username: 'john_warehouse',
                email: 'john@toollink.com',
                password: 'password123',
                fullName: 'John Smith',
                phone: '+94712345678',
                role: 'warehouse',
                isApproved: true,
                emailVerified: true,
                isActive: true
            },
            {
                username: 'mary_cashier',
                email: 'mary@toollink.com',
                password: 'password123',
                fullName: 'Mary Johnson',
                phone: '+94723456789',
                role: 'cashier',
                isApproved: true,
                emailVerified: true,
                isActive: true
            },
            {
                username: 'bob_driver',
                email: 'bob@toollink.com',
                password: 'password123',
                fullName: 'Bob Wilson',
                phone: '+94734567890',
                role: 'driver',
                isApproved: true,
                emailVerified: true,
                isActive: true
            }
        ];

        console.log('\\n=== ADDING TEST USERS TO DATABASE ===');

        for (const userData of testUsers) {
            try {
                // Check if user already exists
                const existingUser = await User.findOne({ email: userData.email });
                if (existingUser) {
                    console.log(`User ${userData.email} already exists in database`);
                    continue;
                }

                // Create new user
                const user = new User(userData);
                await user.save();
                console.log(`✅ Added user: ${userData.fullName} (${userData.email}) - Role: ${userData.role}`);
            } catch (error) {
                console.error(`❌ Error adding user ${userData.email}:`, error.message);
            }
        }

        // Show final user count
        const totalUsers = await User.countDocuments({ deletedAt: null });
        const activeUsers = await User.countDocuments({ deletedAt: null, isActive: true });

        console.log('\\n=== DATABASE STATUS ===');
        console.log(`Total non-deleted users: ${totalUsers}`);
        console.log(`Active users: ${activeUsers}`);

        await mongoose.connection.close();
        console.log('\\n✅ Test users added successfully to toollink database!');
    } catch (error) {
        console.error('Error adding test users:', error);
    }
}

addTestUsers();
