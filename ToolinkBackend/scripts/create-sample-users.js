import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { config } from 'dotenv';
import logger from '../src/utils/logger.js';

// Load environment variables
config();

const SAMPLE_USERS = [
    {
        username: 'warehouse_manager',
        email: 'warehouse@toollink.com',
        password: 'warehouse123',
        fullName: 'Warehouse Manager',
        role: 'warehouse',
        phone: '+94771234567',
        address: {
            street: '123 Warehouse Street',
            city: 'Colombo',
            state: 'Western',
            zipCode: '10100',
            country: 'Sri Lanka'
        }
    },
    {
        username: 'cashier_user',
        email: 'cashier@toollink.com',
        password: 'cashier123',
        fullName: 'Cashier User',
        role: 'cashier',
        phone: '+94771234568',
        address: {
            street: '456 Shop Street',
            city: 'Colombo',
            state: 'Western',
            zipCode: '10200',
            country: 'Sri Lanka'
        }
    },
    {
        username: 'delivery_driver',
        email: 'driver@toollink.com',
        password: 'driver123',
        fullName: 'Delivery Driver',
        role: 'driver',
        phone: '+94771234569',
        address: {
            street: '789 Driver Road',
            city: 'Gampaha',
            state: 'Western',
            zipCode: '11000',
            country: 'Sri Lanka'
        }
    },
    {
        username: 'customer_test',
        email: 'customer@toollink.com',
        password: 'customer123',
        fullName: 'Test Customer',
        role: 'customer',
        phone: '+94771234570',
        address: {
            street: '321 Customer Avenue',
            city: 'Kandy',
            state: 'Central',
            zipCode: '20000',
            country: 'Sri Lanka'
        }
    },
    {
        username: 'editor_user',
        email: 'editor@toollink.com',
        password: 'editor123',
        fullName: 'Content Editor',
        role: 'editor',
        phone: '+94771234571',
        address: {
            street: '654 Editor Lane',
            city: 'Colombo',
            state: 'Western',
            zipCode: '10300',
            country: 'Sri Lanka'
        }
    }
];

async function createSampleUsers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas successfully');

        console.log('Creating sample users for different roles...');

        for (const userData of SAMPLE_USERS) {
            try {
                // Check if user already exists
                const existingUser = await User.findByEmailOrUsername(userData.email);
                if (existingUser) {
                    console.log(`User ${userData.email} already exists, skipping...`);
                    continue;
                }

                // Create user
                const user = new User({
                    ...userData,
                    isApproved: true,
                    emailVerified: true,
                    isActive: true
                });

                await user.save();
                console.log(`✅ Created ${userData.role} user: ${userData.email} (${userData.fullName})`);
            } catch (error) {
                console.error(`❌ Failed to create user ${userData.email}:`, error.message);
            }
        }

        console.log('\n📊 User Creation Summary:');
        console.log('========================');

        const roles = ['admin', 'warehouse', 'cashier', 'driver', 'customer', 'editor', 'user'];
        for (const role of roles) {
            const count = await User.countDocuments({ role, deletedAt: null });
            console.log(`${role.padEnd(10)}: ${count} users`);
        }

        const totalUsers = await User.countDocuments({ deletedAt: null });
        console.log(`${'Total'.padEnd(10)}: ${totalUsers} users`);

        console.log('\n🔐 Login Credentials:');
        console.log('=====================');
        console.log('Admin:     admin@toollink.com / admin123');
        console.log('Warehouse: warehouse@toollink.com / warehouse123');
        console.log('Cashier:   cashier@toollink.com / cashier123');
        console.log('Driver:    driver@toollink.com / driver123');
        console.log('Customer:  customer@toollink.com / customer123');
        console.log('Editor:    editor@toollink.com / editor123');

    } catch (error) {
        console.error('Error creating sample users:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

// Run the script
createSampleUsers().catch(console.error);
