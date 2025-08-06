import mongoose from 'mongoose';
import Message from './src/models/Message.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function clearAllMessages() {
    try {
        console.log('🗑️  Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');

        console.log('📊 Checking current message count...');
        const currentCount = await Message.countDocuments();
        console.log(`📊 Found ${currentCount} messages in database`);

        if (currentCount === 0) {
            console.log('📭 No messages to delete');
            return;
        }

        console.log('🗑️  Deleting all messages...');
        const result = await Message.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} messages`);

        // Verify deletion
        const finalCount = await Message.countDocuments();
        console.log(`📊 Final message count: ${finalCount}`);

        if (finalCount === 0) {
            console.log('🎉 All messages cleared successfully!');
        } else {
            console.log('⚠️  Some messages may still exist');
        }

    } catch (error) {
        console.error('❌ Error clearing messages:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from database');
    }
}

clearAllMessages();
