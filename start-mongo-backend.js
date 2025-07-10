#!/usr/bin/env node

/**
 * Simple MongoDB Backend Starter
 * This script starts the ToolLink backend with MongoDB support
 */

const path = require('path');

// Change to the correct directory
const backendDir = path.join(__dirname, 'ToolLink-MySQL-Backend');
process.chdir(backendDir);

console.log('🚀 Starting ToolLink Backend with MongoDB...');
console.log('Current directory:', process.cwd());

try {
    // Start the MongoDB app
    require('./ToolLink-MySQL-Backend/src/app-mongo.js');
} catch (error) {
    console.error('❌ Failed to start backend:', error.message);
    
    // Try alternative path
    try {
        require('./src/app-mongo.js');
    } catch (altError) {
        console.error('❌ Alternative path failed:', altError.message);
        process.exit(1);
    }
}
