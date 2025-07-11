import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables
config();

async function testDatabaseConnection() {
    try {
        console.log('🔄 Connecting to MongoDB Atlas...');

        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB Atlas successfully!');

        // Test user count
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const userCount = await User.countDocuments();
        console.log(`📊 Total users in database: ${userCount}`);

        // Test if we can fetch admin user
        const adminUser = await User.findOne({ email: 'admin@toollink.com' });
        if (adminUser) {
            console.log(`👤 Admin user found: ${adminUser.email} (Role: ${adminUser.role})`);
        }

        // Test other collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📁 Available collections: ${collections.map(c => c.name).join(', ')}`);

        console.log('🎉 Database connection test completed successfully!');

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔐 Database connection closed.');
        process.exit(0);
    }
}

testDatabaseConnection();
