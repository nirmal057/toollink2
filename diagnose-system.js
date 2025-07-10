#!/usr/bin/env node

/**
 * System Diagnostic and Startup Script
 * This script checks for common issues and starts the system properly
 */

console.log('🔍 ToolLink System Diagnostic Starting...');
console.log('=' .repeat(50));

// Check Node.js version
console.log('\n📋 System Information:');
console.log(`Node.js Version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Working Directory: ${process.cwd()}`);

// Check if we're in the right directory
const fs = require('fs');
const path = require('path');

console.log('\n📂 Directory Structure Check:');
const backendExists = fs.existsSync('ToolinkBackend');
const frontendExists = fs.existsSync('ToolLink');

if (backendExists) {
    console.log('✅ ToolinkBackend directory found');
    
    // Check backend files
    const appExists = fs.existsSync('ToolinkBackend/src/app.js');
    const packageExists = fs.existsSync('ToolinkBackend/package.json');
    
    console.log(`  📄 app.js: ${appExists ? '✅ Found' : '❌ Missing'}`);
    console.log(`  📄 package.json: ${packageExists ? '✅ Found' : '❌ Missing'}`);
    
    if (packageExists) {
        try {
            const pkg = JSON.parse(fs.readFileSync('ToolinkBackend/package.json', 'utf8'));
            console.log(`  📦 Package: ${pkg.name} v${pkg.version}`);
        } catch (e) {
            console.log('  ❌ Error reading package.json');
        }
    }
    
    // Check if node_modules exists
    const nodeModulesExists = fs.existsSync('ToolinkBackend/node_modules');
    console.log(`  📁 node_modules: ${nodeModulesExists ? '✅ Found' : '❌ Missing (need to run npm install)'}`);
    
} else {
    console.log('❌ ToolinkBackend directory not found');
}

if (frontendExists) {
    console.log('✅ ToolLink directory found');
    
    // Check frontend files
    const indexExists = fs.existsSync('ToolLink/index.html');
    const packageExists = fs.existsSync('ToolLink/package.json');
    
    console.log(`  📄 index.html: ${indexExists ? '✅ Found' : '❌ Missing'}`);
    console.log(`  📄 package.json: ${packageExists ? '✅ Found' : '❌ Missing'}`);
    
    // Check if node_modules exists
    const nodeModulesExists = fs.existsSync('ToolLink/node_modules');
    console.log(`  📁 node_modules: ${nodeModulesExists ? '✅ Found' : '❌ Missing (need to run npm install)'}`);
    
} else {
    console.log('❌ ToolLink directory not found');
}

console.log('\n🔧 Startup Instructions:');
console.log('');

if (!backendExists || !frontendExists) {
    console.log('❌ CRITICAL: Missing project directories');
    console.log('   Make sure you are in the correct project folder');
    console.log('   Expected structure:');
    console.log('   📁 project-folder/');
    console.log('   ├── 📁 ToolinkBackend/');
    console.log('   └── 📁 ToolLink/');
    process.exit(1);
}

console.log('To start the system, run these commands in separate terminals:');
console.log('');
console.log('🎯 Terminal 1 (Backend):');
console.log('   cd ToolinkBackend');
console.log('   npm install    # (if node_modules missing)');
console.log('   npm start      # or node src/app.js');
console.log('');
console.log('🎯 Terminal 2 (Frontend):');
console.log('   cd ToolLink');
console.log('   npm install    # (if node_modules missing)');
console.log('   npm run dev    # or npx vite');
console.log('');

console.log('📊 Expected Results:');
console.log('   Backend: http://localhost:5000');
console.log('   Frontend: http://localhost:5173 (or 3000)');
console.log('   Database: SQLite (automatically created)');
console.log('');

console.log('🚨 Common Issues:');
console.log('   1. Port 5000 already in use → Kill process or change PORT');
console.log('   2. Missing node_modules → Run npm install in each folder');
console.log('   3. Database errors → Delete toolink_development.db and restart');
console.log('   4. CORS errors → Make sure both servers are running');
console.log('');

console.log('🔍 Quick Test Commands:');
console.log('   Test Backend: curl http://localhost:5000/api/health');
console.log('   Test Database: node test-cashier-login.js');
console.log('   Test System: node test-complete-system.js');
console.log('');

console.log('=' .repeat(50));
console.log('✨ Diagnostic Complete');
