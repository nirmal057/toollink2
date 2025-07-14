import mongoose from 'mongoose';
import User from './src/models/User.js';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/toollink';

async function cleanupSoftDeletedUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to toollink database');

        // Find all soft-deleted users
        const softDeletedUsers = await User.find({ deletedAt: { $ne: null } });
        console.log('\\n=== CLEANING UP SOFT-DELETED USERS ===');
        console.log(`Found ${softDeletedUsers.length} soft-deleted users to permanently remove`);

        for (const user of softDeletedUsers) {
            console.log(`Permanently deleting: ${user.fullName} (${user.email})`);
            await User.findByIdAndDelete(user._id);
        }

        // Show final count
        const remainingUsers = await User.find({});
        console.log('\\n=== CLEANUP COMPLETE ===');
        console.log(`Permanently deleted: ${softDeletedUsers.length} users`);
        console.log(`Users remaining in database: ${remainingUsers.length}`);

        console.log('\\nRemaining users:');
        remainingUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.fullName} (${user.email}) - ${user.role}`);
        });

        await mongoose.connection.close();
        console.log('\\n✅ Database cleanup completed!');
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

cleanupSoftDeletedUsers();
