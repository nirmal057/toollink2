const mongoose = require('mongoose');
require('dotenv').config({ path: './ToolinkBackend/.env' });

async function testMongoDBAtlasConnection() {
    console.log('🔗 Testing MongoDB Atlas Connection...\n');

    const mongoURI = process.env.MONGODB_URI;
    console.log('📍 Connection String:');
    console.log(`   ${mongoURI.replace(/mongodb\+srv:\/\/([^:]+):[^@]+@/, 'mongodb+srv://$1:****@')}`);
    console.log('');

    try {
        // Connect to MongoDB Atlas
        console.log('🔄 Connecting to MongoDB Atlas...');
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        console.log('✅ Successfully connected to MongoDB Atlas!');
        console.log('');

        // Get connection details
        const connection = mongoose.connection;
        console.log('📊 Connection Details:');
        console.log(`   Host: ${connection.host}`);
        console.log(`   Database: ${connection.name}`);
        console.log(`   Port: ${connection.port}`);
        console.log(`   Ready State: ${connection.readyState} (1 = connected)`);
        console.log('');

        // Test database operations
        console.log('🧪 Testing Database Operations...');

        // List collections
        const collections = await connection.db.listCollections().toArray();
        console.log(`   Collections found: ${collections.length}`);
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });

        // Test a simple query (check if users collection exists)
        const User = mongoose.model('User', new mongoose.Schema({
            email: String,
            username: String,
            role: String
        }));

        const userCount = await User.countDocuments();
        console.log(`   Users in database: ${userCount}`);

        console.log('');
        console.log('🎉 MongoDB Atlas Connection Test SUCCESSFUL!');
        console.log('');
        console.log('🔑 Available Collections:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        collections.forEach(col => {
            console.log(`✓ ${col.name}`);
        });

    } catch (error) {
        console.error('❌ MongoDB Atlas Connection Failed:');
        console.error(`   Error: ${error.message}`);

        if (error.name === 'MongoServerSelectionError') {
            console.log('');
            console.log('💡 Troubleshooting Tips:');
            console.log('   1. Check your internet connection');
            console.log('   2. Verify MongoDB Atlas IP whitelist settings');
            console.log('   3. Ensure the connection string is correct');
            console.log('   4. Check if MongoDB Atlas cluster is running');
        }
    } finally {
        await mongoose.disconnect();
        console.log('');
        console.log('🔌 Disconnected from MongoDB');
    }
}

testMongoDBAtlasConnection();
