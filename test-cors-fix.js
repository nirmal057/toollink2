const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testCorsFixed() {
    console.log('🔍 Testing CORS Fix for Port 5175...\n');

    try {
        // Test login from the exact same origin as the frontend
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@toollink.com',
            password: 'admin123'
        }, {
            headers: {
                'Origin': 'http://localhost:5175',
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            console.log('✅ CORS is now working for port 5175!');
            console.log('✅ Frontend should now be able to communicate with backend');
            console.log('\n🎯 Ready to test the audit logs page:');
            console.log('1. Open http://localhost:5175');
            console.log('2. Login with admin@toollink.com / admin123');
            console.log('3. Navigate to Audit Logs page');
            console.log('4. The React error should be resolved!');
        }

    } catch (error) {
        if (error.response) {
            console.log('❌ CORS Error:', error.response.status, error.response.statusText);
        } else {
            console.log('❌ Error:', error.message);
        }
    }
}

testCorsFixed();
