#!/usr/bin/env node

/**
 * ToolLink System Startup & Status Check
 * Comprehensive verification and launch script
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:5173';

async function checkSystemStatus() {
    console.log('🚀 ToolLink System Status Check');
    console.log('================================\n');

    // Check Backend
    console.log('1. Backend Status (MongoDB)...');
    try {
        const healthResponse = await axios.get(`${BACKEND_URL}/api/health`);
        console.log('✅ Backend: RUNNING');
        console.log(`   - Status: ${healthResponse.data.status}`);
        console.log(`   - Database: ${healthResponse.data.database}`);
        console.log(`   - Port: ${healthResponse.data.port}`);
    } catch (error) {
        console.log('❌ Backend: NOT RUNNING');
        console.log('   Please start backend with: node mongodb-backend.js');
        return false;
    }

    // Check Frontend
    console.log('\n2. Frontend Status (React/Vite)...');
    try {
        const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 5000 });
        if (frontendResponse.status === 200) {
            console.log('✅ Frontend: RUNNING');
            console.log(`   - URL: ${FRONTEND_URL}`);
            console.log('   - Type: React + Vite Development Server');
        }
    } catch (error) {
        console.log('❌ Frontend: NOT ACCESSIBLE');
        console.log('   Please start frontend with: npx vite');
        return false;
    }

    // Test Authentication
    console.log('\n3. Authentication Test...');
    try {
        const loginResponse = await axios.post(`${BACKEND_URL}/api/auth-enhanced/login`, {
            email: 'admin@toollink.com',
            password: 'admin123'
        });
        
        if (loginResponse.data.success) {
            console.log('✅ Authentication: WORKING');
            console.log(`   - Admin User: ${loginResponse.data.user.email}`);
            console.log(`   - Role: ${loginResponse.data.user.role}`);
        }
    } catch (error) {
        console.log('❌ Authentication: FAILED');
        console.log(`   - Error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎯 System Ready for Use!');
    console.log('========================');
    console.log(`Frontend: ${FRONTEND_URL}`);
    console.log(`Backend:  ${BACKEND_URL}`);
    console.log('Admin Login: admin@toollink.com / admin123');
    console.log('\n🌟 Open your browser to start using ToolLink!');
    
    return true;
}

if (require.main === module) {
    checkSystemStatus().catch(console.error);
}

module.exports = { checkSystemStatus };
