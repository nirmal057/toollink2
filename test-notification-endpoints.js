const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

console.log('🔔 Testing Notification API Endpoints');
console.log('='.repeat(50));

async function testNotificationEndpoints() {
    try {
        // First authenticate as admin
        console.log('\n1️⃣ Authenticating as admin...');
        const authResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        const token = authResponse.data.accessToken;
        console.log(`✅ Admin authenticated, token received: ${token ? 'Yes' : 'No'}`);

        const authenticatedAxios = axios.create({
            baseURL: BASE_URL,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Test unread count endpoint
        console.log('\n2️⃣ Testing GET /api/notifications/unread-count...');
        try {
            const unreadResponse = await authenticatedAxios.get('/api/notifications/unread-count');
            console.log(`✅ Success: Unread count endpoint works`);
            console.log(`   Response:`, JSON.stringify(unreadResponse.data, null, 2));
        } catch (error) {
            console.log(`❌ Unread count endpoint failed:`);
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Data:`, JSON.stringify(error.response?.data, null, 2));
        }

        // Test main notifications endpoint
        console.log('\n3️⃣ Testing GET /api/notifications...');
        try {
            const notificationsResponse = await authenticatedAxios.get('/api/notifications');
            console.log(`✅ Success: Notifications endpoint works`);
            console.log(`   Found ${notificationsResponse.data.data?.length || 0} notifications`);
        } catch (error) {
            console.log(`❌ Notifications endpoint failed:`);
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Data:`, JSON.stringify(error.response?.data, null, 2));
        }

        // Test route listing
        console.log('\n4️⃣ Testing server route availability...');
        try {
            // Test a simple endpoint to check server status
            const healthResponse = await axios.get(`${BASE_URL}/api/auth/health`);
            console.log(`✅ Server is responding`);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log(`ℹ️  Server is responding (404 is expected for /health)`);
            } else {
                console.log(`⚠️  Server connectivity issue: ${error.message}`);
            }
        }

        // Test without authentication
        console.log('\n5️⃣ Testing notification endpoint without auth...');
        try {
            const noAuthResponse = await axios.get(`${BASE_URL}/api/notifications/unread-count`);
            console.log(`⚠️  Unread count works without auth (potential security issue)`);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log(`✅ Properly requires authentication (401 error)`);
            } else {
                console.log(`❌ Unexpected error: Status ${error.response?.status}`);
                console.log(`   Message: ${error.response?.data?.error || error.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testNotificationEndpoints();
