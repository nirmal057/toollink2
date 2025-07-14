import mongoose from 'mongoose';
import User from './src/models/User.js';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/toollink';

async function checkUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to database');

        // Get all users (including those not approved)
        const allUsers = await User.find({}).select('-password');
        console.log('\n=== ALL USERS IN DATABASE ===');
        console.log('Total users:', allUsers.length);

        allUsers.forEach((user, index) => {
            console.log(`User ${index + 1}:`);
            console.log('  ID:', user._id);
            console.log('  Email:', user.email);
            console.log('  Full Name:', user.fullName);
            console.log('  Role:', user.role);
            console.log('  isActive:', user.isActive);
            console.log('  isApproved:', user.isApproved);
            console.log('  deletedAt:', user.deletedAt);
            console.log('  ---');
        });

        // Check what the API filter would return
        const apiUsers = await User.find({
            deletedAt: null,
            isApproved: true
        }).select('-password');

        console.log('\n=== USERS THAT API WOULD RETURN ===');
        console.log('API filtered users:', apiUsers.length);

        apiUsers.forEach((user, index) => {
            console.log(`API User ${index + 1}:`);
            console.log('  Email:', user.email);
            console.log('  Full Name:', user.fullName);
            console.log('  Role:', user.role);
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUsers();
