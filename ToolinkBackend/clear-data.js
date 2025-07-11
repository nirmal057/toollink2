import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables
config();

async function clearCollections() {
    try {
        console.log('🔄 Connecting to MongoDB Atlas...');

        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB Atlas successfully!');

        // Get database instance
        const db = mongoose.connection.db;

        // Check current counts before deletion
        console.log('\n📊 Current data counts:');
        const usersCount = await db.collection('users').countDocuments();
        const ordersCount = await db.collection('orders').countDocuments();
        console.log(`👥 Users: ${usersCount}`);
        console.log(`📦 Orders: ${ordersCount}`);

        // Confirm deletion
        console.log('\n⚠️  About to delete ALL users and orders data...');
        console.log('🗑️  Clearing users collection...');

        // Delete all users
        const usersResult = await db.collection('users').deleteMany({});
        console.log(`✅ Deleted ${usersResult.deletedCount} users`);

        console.log('🗑️  Clearing orders collection...');

        // Delete all orders
        const ordersResult = await db.collection('orders').deleteMany({});
        console.log(`✅ Deleted ${ordersResult.deletedCount} orders`);

        // Verify deletion
        console.log('\n📊 Final counts after deletion:');
        const finalUsersCount = await db.collection('users').countDocuments();
        const finalOrdersCount = await db.collection('orders').countDocuments();
        console.log(`👥 Users remaining: ${finalUsersCount}`);
        console.log(`📦 Orders remaining: ${finalOrdersCount}`);

        console.log('\n🎉 Collections cleared successfully!');
        console.log('💡 Ready for new data import.');

    } catch (error) {
        console.error('❌ Error clearing collections:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔐 Database connection closed.');
        process.exit(0);
    }
}

clearCollections();
