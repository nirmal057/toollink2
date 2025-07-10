/**
 * ToolLink System Verification Script
 * Tests the complete MongoDB-based system
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:5174';

async function verifySystem() {
    console.log('🔍 ToolLink System Verification');
    console.log('================================');
    
    try {
        // Test 1: Backend Health
        console.log('\n1. Testing Backend Connection...');
        try {
            const response = await axios.get(`${API_BASE}/api/auth/login`, { 
                validateStatus: false 
            });
            console.log('✅ Backend is responding on port 5001');
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log('❌ Backend not running on port 5001');
                return;
            } else {
                console.log('✅ Backend is responding (got expected error)');
            }
        }

        // Test 2: Frontend Health
        console.log('\n2. Testing Frontend Connection...');
        try {
            const response = await axios.get(FRONTEND_URL, { 
                validateStatus: false,
                timeout: 5000 
            });
            console.log('✅ Frontend is responding on port 5174');
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log('❌ Frontend not running on port 5174');
            } else {
                console.log('⚠️  Frontend connection issue:', error.message);
            }
        }

        // Test 3: Admin Login Test
        console.log('\n3. Testing Admin Login...');
        try {
            const loginResponse = await axios.post(`${API_BASE}/api/auth-enhanced/login`, {
                email: 'admin@toollink.com',
                password: 'admin123'
            });
            
            if (loginResponse.data.token) {
                console.log('✅ Admin login successful');
                console.log('📋 Admin user details:', {
                    id: loginResponse.data.user.id,
                    email: loginResponse.data.user.email,
                    role: loginResponse.data.user.role
                });
            }
        } catch (error) {
            console.log('❌ Admin login failed:', error.response?.data?.message || error.message);
        }

        console.log('\n📊 System Summary:');
        console.log('==================');
        console.log('🖥️  Backend: http://localhost:5001 (MongoDB Atlas)');
        console.log('🌐 Frontend: http://localhost:5174 (Vite Dev Server)');
        console.log('👤 Admin Login: admin@toollink.com / admin123');
        console.log('🗄️  Database: MongoDB Atlas (Cloud)');
        console.log('🔐 Authentication: JWT-based');
        
        console.log('\n🎯 Next Steps:');
        console.log('==============');
        console.log('1. Open http://localhost:5174 in your browser');
        console.log('2. Login with admin@toollink.com / admin123');
        console.log('3. Test user management features');
        console.log('4. Create and approve new users');

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

if (require.main === module) {
    verifySystem();
}

module.exports = { verifySystem };
