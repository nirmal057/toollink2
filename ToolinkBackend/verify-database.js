import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

async function verifyDatabase() {
    try {
        console.log('🔍 Verifying MongoDB Database...\n');
        await mongoose.connect(process.env.MONGODB_URI);

        const db = mongoose.connection.db;

        // Get all collections
        const collections = await db.listCollections().toArray();

        console.log('📋 Collections in your ToolLink database:');
        console.log('='.repeat(50));

        for (const collection of collections) {
            const count = await db.collection(collection.name).countDocuments();
            const sampleDoc = await db.collection(collection.name).findOne();

            console.log(`\n📂 ${collection.name.toUpperCase()}`);
            console.log(`   Documents: ${count}`);

            if (sampleDoc) {
                if (collection.name === 'users') {
                    console.log(`   Sample: ${sampleDoc.username} (${sampleDoc.email}) - Role: ${sampleDoc.role}`);
                } else if (collection.name === 'inventories') {
                    console.log(`   Sample: ${sampleDoc.name} - SKU: ${sampleDoc.sku} - Stock: ${sampleDoc.current_stock}`);
                } else if (collection.name === 'notifications') {
                    console.log(`   Sample: ${sampleDoc.title} - Type: ${sampleDoc.type}`);
                } else {
                    console.log(`   Sample data exists`);
                }
            } else {
                console.log(`   No documents yet`);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎯 Database Structure Summary:');
        console.log('✅ Core Collections:');
        console.log('   • users - User accounts and authentication');
        console.log('   • inventories - Product/tool inventory management');
        console.log('   • orders - Customer orders and transactions');
        console.log('   • notifications - System and user notifications');
        console.log('   • activities - User activity logging');
        console.log('   • deliveries - Delivery tracking and management');
        console.log('   • feedbacks - Customer feedback and reviews');
        console.log('   • reports - Generated reports storage');
        console.log('   • predictions - ML predictions and analytics');

        console.log('\n🔗 Database URL: mongodb://localhost:27017/toollink');
        console.log('🌐 You can also view this data using MongoDB Compass');

    } catch (error) {
        console.error('❌ Database verification failed:', error);
    } finally {
        await mongoose.connection.close();
    }
}

verifyDatabase();
