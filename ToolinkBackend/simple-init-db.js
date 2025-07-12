import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables
config();

async function initializeDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        console.log('Using connection string:', process.env.MONGODB_URI);

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully!');

        const db = mongoose.connection.db;

        // List existing collections
        const existingCollections = await db.listCollections().toArray();
        console.log('📋 Existing collections:');
        existingCollections.forEach(col => console.log(`   • ${col.name}`));

        // Create collections if they don't exist
        const requiredCollections = [
            'users',
            'inventories',
            'orders',
            'notifications',
            'activities',
            'deliveries',
            'feedbacks',
            'reports',
            'predictions'
        ];

        console.log('\n🏗️  Creating/ensuring collections exist...');

        for (const collectionName of requiredCollections) {
            const exists = existingCollections.some(col => col.name === collectionName);
            if (!exists) {
                await db.createCollection(collectionName);
                console.log(`   ✅ Created collection: ${collectionName}`);
            } else {
                console.log(`   ℹ️  Collection already exists: ${collectionName}`);
            }
        }

        // Get collection stats
        console.log('\n📊 Collection Statistics:');
        for (const collectionName of requiredCollections) {
            try {
                const stats = await db.collection(collectionName).stats();
                console.log(`   • ${collectionName}: ${stats.count} documents, ${(stats.size / 1024).toFixed(2)} KB`);
            } catch (error) {
                const count = await db.collection(collectionName).countDocuments();
                console.log(`   • ${collectionName}: ${count} documents`);
            }
        }

        console.log('\n🎉 Database initialization completed!');
        console.log('\n💡 Note: The collections are now ready for your ToolLink application.');
        console.log('   You can now use the application and data will be stored in these collections.');

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run initialization
initializeDatabase()
    .then(() => {
        console.log('✅ Initialization completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Initialization failed:', error.message);
        process.exit(1);
    });
