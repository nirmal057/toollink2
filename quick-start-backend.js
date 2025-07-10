#!/usr/bin/env node

/**
 * Quick Backend Startup Test
 * This script starts the backend and tests basic functionality
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 ToolLink Backend Startup Script');
console.log('=' .repeat(40));

// Check if we're in the right directory
const backendPath = path.join(process.cwd(), 'ToolinkBackend');
const appPath = path.join(backendPath, 'src', 'app.js');

console.log(`📂 Backend Path: ${backendPath}`);
console.log(`📄 App Path: ${appPath}`);

// Check if files exist
const fs = require('fs');
if (!fs.existsSync(appPath)) {
    console.error('❌ app.js not found at:', appPath);
    process.exit(1);
}

console.log('✅ Backend files found');
console.log('🔄 Starting backend server...');

// Change to backend directory
process.chdir(backendPath);

// Start the backend server
const backend = spawn('node', ['src/app.js'], {
    stdio: 'inherit',
    cwd: backendPath
});

backend.on('error', (error) => {
    console.error('❌ Failed to start backend:', error.message);
});

backend.on('close', (code) => {
    console.log(`\n🔴 Backend server stopped with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down backend server...');
    backend.kill('SIGINT');
    process.exit(0);
});

// Test connection after a delay
setTimeout(async () => {
    try {
        console.log('\n🔍 Testing backend connection...');
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend is running:', data.message);
            console.log('🌐 Visit: http://localhost:5000/api');
        }
    } catch (error) {
        console.log('⏳ Backend still starting up...');
    }
}, 3000);
