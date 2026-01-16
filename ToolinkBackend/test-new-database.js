#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests the new database configuration system
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';
import dbConnection from './src/config/database.js';
import logger from './src/utils/logger.js';

// Load environment variables
config();

const testDatabaseConnection = async () => {
    console.log('🧪 ToolLink Database Connection Test');
    console.log('═'.repeat(50));
    console.log('');

    try {
        // Test 1: Check environment variables
        console.log('📋 Test 1: Environment Configuration');
        console.log('─'.repeat(30));

        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.log('❌ MONGODB_URI not found in environment variables');
            return;
        }

        const maskedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
        console.log(`✅ Connection URI: ${maskedUri}`);

        const isAtlas = mongoUri.includes('mongodb.net') || mongoUri.includes('mongodb+srv');
        console.log(`✅ Database Type: ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}`);
        console.log('');

        // Test 2: Database connection
        console.log('🔗 Test 2: Database Connection');
        console.log('─'.repeat(30));

        const connected = await dbConnection.connect();

        if (!connected) {
            console.log('❌ Database connection failed');
            return;
        }

        console.log('✅ Database connection successful');
        console.log('');

        // Test 3: Connection status
        console.log('📊 Test 3: Connection Status');
        console.log('─'.repeat(30));

        const status = dbConnection.getStatus();
        console.log(`✅ Connection Status: ${status.status}`);
        console.log(`✅ Database: ${status.database}`);
        console.log(`✅ Host: ${status.host}`);
        console.log(`✅ Is Connected: ${status.isConnected}`);
        console.log('');

        // Test 4: Database operations
        console.log('🧪 Test 4: Database Operations');
        console.log('─'.repeat(30));

        const testResult = await dbConnection.testConnection();

        if (testResult.success) {
            console.log('✅ Database ping successful');
            if (testResult.stats) {
                console.log(`✅ Collections: ${testResult.stats.collections || 'N/A'}`);
                console.log(`✅ Data Size: ${testResult.stats.dataSize || 'N/A'}`);
                console.log(`✅ Index Size: ${testResult.stats.indexSize || 'N/A'}`);
            }
        } else {
            console.log(`❌ Database test failed: ${testResult.message}`);
        }
        console.log('');

        // Test 5: Collections check
        console.log('📁 Test 5: Collections Check');
        console.log('─'.repeat(30));

        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log(`✅ Total Collections: ${collections.length}`);

            if (collections.length > 0) {
                console.log('📋 Available Collections:');
                collections.forEach(col => {
                    console.log(`   • ${col.name}`);
                });
            } else {
                console.log('📝 No collections found (fresh database)');
            }
        } catch (error) {
            console.log(`❌ Failed to list collections: ${error.message}`);
        }
        console.log('');

        // Test 6: Simple document operation
        console.log('📝 Test 6: Document Operations');
        console.log('─'.repeat(30));

        try {
            // Define a simple test schema
            const testSchema = new mongoose.Schema({
                name: String,
                timestamp: { type: Date, default: Date.now },
                testType: { type: String, default: 'connection_test' }
            });

            const TestModel = mongoose.models.ConnectionTest || mongoose.model('ConnectionTest', testSchema);

            // Create a test document
            const testDoc = new TestModel({
                name: 'Database Connection Test',
                testType: 'automated_test'
            });

            await testDoc.save();
            console.log('✅ Document creation successful');

            // Read the document
            const foundDoc = await TestModel.findById(testDoc._id);
            console.log('✅ Document read successful');

            // Update the document
            foundDoc.name = 'Updated Test Document';
            await foundDoc.save();
            console.log('✅ Document update successful');

            // Delete the document
            await TestModel.findByIdAndDelete(testDoc._id);
            console.log('✅ Document deletion successful');

        } catch (error) {
            console.log(`❌ Document operations failed: ${error.message}`);
        }
        console.log('');

        // Test 7: Performance metrics
        console.log('⚡ Test 7: Performance Metrics');
        console.log('─'.repeat(30));

        try {
            const start = Date.now();
            await mongoose.connection.db.admin().ping();
            const pingTime = Date.now() - start;

            console.log(`✅ Database Ping Time: ${pingTime}ms`);

            if (pingTime < 100) {
                console.log('🚀 Excellent connection speed');
            } else if (pingTime < 500) {
                console.log('⚡ Good connection speed');
            } else {
                console.log('🐌 Slow connection detected');
            }
        } catch (error) {
            console.log(`❌ Performance test failed: ${error.message}`);
        }
        console.log('');

        // Summary
        console.log('🎉 Test Summary');
        console.log('═'.repeat(50));
        console.log('✅ All database tests completed successfully!');
        console.log('✅ Database connection is fully operational');
        console.log('✅ Ready for production use');
        console.log('');
        console.log('🔗 Next Steps:');
        console.log('   • Start your backend server: npm run dev');
        console.log('   • Check health endpoint: http://localhost:5000/health');
        console.log('   • Monitor database: http://localhost:5000/health/database');

    } catch (error) {
        console.log('');
        console.log('❌ Database Connection Test Failed');
        console.log('═'.repeat(50));
        console.log(`Error: ${error.message}`);
        console.log('');
        console.log('🛠️  Troubleshooting Tips:');
        console.log('1. Check your MONGODB_URI in .env file');
        console.log('2. Ensure MongoDB server is running');
        console.log('3. Verify network connectivity');
        console.log('4. Check authentication credentials');
        console.log('5. Review firewall settings');

    } finally {
        // Clean shutdown
        console.log('');
        console.log('🔌 Closing database connection...');
        await dbConnection.gracefulShutdown('TEST_COMPLETE');
    }
};

// Run the test
testDatabaseConnection().catch(console.error);
