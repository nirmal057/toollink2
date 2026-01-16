import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

const testDBConnection = async () => {
    console.log('🔍 Testing MongoDB Connection...');
    console.log(`📍 Connecting to: ${process.env.MONGODB_URI}`);

    try {
        const start = Date.now();

        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
            retryWrites: true,
            retryReads: true,
            heartbeatFrequencyMS: 30000,
            directConnection: true,
        });

        const connectionTime = Date.now() - start;
        console.log(`✅ Connected successfully in ${connectionTime}ms`);

        // Test database operations
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log(`📊 Found ${collections.length} collections:`);

        for (const collection of collections) {
            const count = await db.collection(collection.name).countDocuments();
            console.log(`  - ${collection.name}: ${count} documents`);
        }

        // Test ping
        const adminDb = db.admin();
        const ping = await adminDb.ping();
        console.log(`🏓 Database ping: ${JSON.stringify(ping)}`);

        console.log('🎉 Database connection test completed successfully!');

    } catch (error) {
        console.error('❌ Connection failed:', error.message);

        if (error.name === 'MongoServerSelectionError') {
            console.log('💡 Possible solutions:');
            console.log('  1. Make sure MongoDB is running (mongod service)');
            console.log('  2. Check if the connection string is correct');
            console.log('  3. Verify firewall settings');
            console.log('  4. Try connecting with MongoDB Compass');
        }
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from database');
    }
};

testDBConnection();
