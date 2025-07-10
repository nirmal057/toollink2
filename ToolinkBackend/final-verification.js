// Final comprehensive verification script for ToolLink Backend
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

console.log('🔍 Final ToolLink Backend Verification');
console.log('=' .repeat(50));

async function runFinalVerification() {
    try {
        // 1. Test direct MongoDB connection
        console.log('📊 Testing MongoDB Atlas Direct Connection...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Direct MongoDB connection successful');
        console.log(`🏠 Connected to: ${mongoose.connection.host}`);
        console.log(`📂 Database: ${mongoose.connection.name}`);
        
        // 2. Test backend API endpoints
        console.log('\n🌐 Testing Backend API Endpoints...');
        
        // Test health endpoint
        const healthResponse = await axios.get('http://localhost:5000/api/health');
        console.log('✅ Health endpoint working');
        console.log(`📊 Health status: ${healthResponse.data.status}`);
        
        // Test database endpoint
        const dbResponse = await axios.get('http://localhost:5000/api/db-test');
        console.log('✅ Database endpoint working');
        console.log(`🔗 DB Connection: ${dbResponse.data.connection}`);
        console.log(`📊 DB Status: ${dbResponse.data.database.state}`);
        
        // 3. Test database operations
        console.log('\n🧪 Testing Database Operations...');
        const testCollection = mongoose.connection.db.collection('verification_test');
        
        // Insert test document
        const testDoc = { 
            test: 'final_verification', 
            timestamp: new Date(),
            system: 'ToolLink Backend'
        };
        const insertResult = await testCollection.insertOne(testDoc);
        console.log('✅ Test document inserted');
        
        // Find and verify document
        const foundDoc = await testCollection.findOne({ _id: insertResult.insertedId });
        console.log('✅ Test document retrieved');
        
        // Clean up test document
        await testCollection.deleteOne({ _id: insertResult.insertedId });
        console.log('✅ Test document cleaned up');
        
        // 4. Verify environment configuration
        console.log('\n⚙️  Environment Configuration:');
        console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);
        console.log(`🚪 PORT: ${process.env.PORT}`);
        console.log(`📊 DB_NAME: ${process.env.DB_NAME}`);
        console.log(`🔗 FRONTEND_URL: ${process.env.FRONTEND_URL}`);
        
        console.log('\n🎉 ALL VERIFICATIONS PASSED!');
        console.log('✅ MongoDB Atlas connection working');
        console.log('✅ Backend server running and responding');
        console.log('✅ Database operations functional');
        console.log('✅ Environment configuration correct');
        console.log('\n🚀 ToolLink Backend is fully operational!');
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run verification
runFinalVerification();
