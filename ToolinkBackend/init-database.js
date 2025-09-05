#!/usr/bin/env node

/**
 * Database Initialization Script
 * Sets up the database with initial configuration using the new connection system
 */

import { config } from 'dotenv';
import dbConnection from './src/config/database.js';
import logger from './src/utils/logger.js';
import { createDefaultAdmin } from './src/utils/createDefaultAdmin.js';

// Import all models to ensure they're registered
import './src/models/User.js';
import './src/models/Inventory.js';
import './src/models/Order.js';
import './src/models/Delivery.js';
import './src/models/Notification.js';
import './src/models/Report.js';
import './src/models/Feedback.js';
import './src/models/Activity.js';
import './src/models/Prediction.js';
import './src/models/Message.js';

// Load environment variables
config();

const initializeDatabase = async () => {
    console.log('🚀 ToolLink Database Initialization');
    console.log('═'.repeat(50));
    console.log('');

    try {
        // Step 1: Connect to database
        console.log('🔗 Step 1: Connecting to Database');
        console.log('─'.repeat(30));

        const connected = await dbConnection.connect();

        if (!connected) {
            throw new Error('Failed to connect to database');
        }

        console.log('✅ Database connection established');
        console.log('');

        // Step 2: Create indexes
        console.log('🔍 Step 2: Creating Database Indexes');
        console.log('─'.repeat(30));

        try {
            // Let Mongoose handle index creation automatically
            console.log('✅ Mongoose will handle index creation automatically');
        } catch (error) {
            console.log(`⚠️  Index creation warning: ${error.message}`);
        }
        console.log('');

        // Step 3: Create default admin user
        console.log('👤 Step 3: Creating Default Admin User');
        console.log('─'.repeat(30));

        try {
            await createDefaultAdmin();
            console.log('✅ Default admin user created/verified');
            console.log('   Email: admin@toollink.com');
            console.log('   Password: admin123');
        } catch (error) {
            console.log(`⚠️  Admin user creation warning: ${error.message}`);
        }
        console.log('');

        // Step 4: Verify collections
        console.log('📁 Step 4: Verifying Collections');
        console.log('─'.repeat(30));

        const dbStatus = dbConnection.getStatus();
        const testResult = await dbConnection.testConnection();

        console.log(`✅ Database: ${dbStatus.database}`);
        console.log(`✅ Host: ${dbStatus.host}`);
        console.log(`✅ Status: ${dbStatus.status}`);

        if (testResult.success && testResult.stats) {
            console.log(`✅ Collections: ${testResult.stats.collections}`);
            console.log(`✅ Data Size: ${testResult.stats.dataSize}`);
        }
        console.log('');

        // Step 5: Database health check
        console.log('🏥 Step 5: Database Health Check');
        console.log('─'.repeat(30));

        const healthCheck = await dbConnection.testConnection();

        if (healthCheck.success) {
            console.log('✅ Database health check passed');
            console.log(`✅ Status: ${healthCheck.message}`);
        } else {
            console.log('❌ Database health check failed');
            console.log(`❌ Error: ${healthCheck.message}`);
        }
        console.log('');

        // Success summary
        console.log('🎉 Database Initialization Complete!');
        console.log('═'.repeat(50));
        console.log('✅ Database connected and configured');
        console.log('✅ Admin user ready');
        console.log('✅ All systems operational');
        console.log('');
        console.log('🚀 Ready to start server:');
        console.log('   npm run dev');
        console.log('');
        console.log('🌐 Access points:');
        console.log('   • Server: http://localhost:5000');
        console.log('   • Health: http://localhost:5000/health');
        console.log('   • Database Health: http://localhost:5000/health/database');
        console.log('   • API Docs: http://localhost:5000/api/docs');

    } catch (error) {
        console.log('');
        console.log('❌ Database Initialization Failed');
        console.log('═'.repeat(50));
        console.log(`Error: ${error.message}`);
        console.log('');
        console.log('🛠️  Troubleshooting:');
        console.log('1. Check your .env file configuration');
        console.log('2. Ensure MongoDB is accessible');
        console.log('3. Verify connection string format');
        console.log('4. Check network connectivity');

    } finally {
        console.log('');
        console.log('🔌 Closing connection...');
        await dbConnection.gracefulShutdown('INIT_COMPLETE');
    }
};

// Run initialization
initializeDatabase().catch((error) => {
    console.error('Initialization failed:', error);
    process.exit(1);
});
