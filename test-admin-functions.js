const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test admin login and get token
async function getAdminToken() {
    try {
        console.log('🔐 Attempting admin login...');
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@toolink.com',
            password: 'admin123'
        });

        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('✅ Admin login successful');
            return response.data.token;
        } else {
            console.log('❌ Admin login failed:', response.data.error);
            return null;
        }
    } catch (error) {
        console.log('❌ Admin login error:', error.response?.status);
        console.log('Error data:', error.response?.data);
        console.log('Error message:', error.message);
        return null;
    }
}

// Test all admin endpoints
async function testAdminFunctions() {
    console.log('🔧 Testing Admin Functions...\n');

    const token = await getAdminToken();
    if (!token) {
        console.log('❌ Cannot proceed without admin token');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Test admin endpoints
    const adminTests = [
        {
            name: 'Admin Dashboard',
            method: 'GET',
            url: `${BASE_URL}/admin/dashboard`
        },
        {
            name: 'Audit Logs',
            method: 'GET',
            url: `${BASE_URL}/admin/audit-logs`
        },
        {
            name: 'System Config',
            method: 'GET',
            url: `${BASE_URL}/admin/config`
        },
        {
            name: 'System Reports',
            method: 'GET',
            url: `${BASE_URL}/admin/reports`
        },
        {
            name: 'Admin Analytics',
            method: 'GET',
            url: `${BASE_URL}/admin/analytics`
        }
    ];

    for (const test of adminTests) {
        try {
            const response = await axios({
                method: test.method,
                url: test.url,
                headers
            });

            if (response.data.success) {
                console.log(`✅ ${test.name}: PASSED`);
                console.log(`   Response keys: ${Object.keys(response.data).join(', ')}`);
            } else {
                console.log(`❌ ${test.name}: FAILED - ${response.data.error}`);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ERROR - ${error.response?.data?.error || error.message}`);
        }
    }

    // Test bulk user operation
    try {
        console.log('\n🔧 Testing Bulk User Operation...');
        const response = await axios.post(`${BASE_URL}/admin/users/bulk`, {
            operation: 'activate',
            userIds: [1, 2],
            data: {}
        }, { headers });

        if (response.data.success) {
            console.log('✅ Bulk User Operation: PASSED');
            console.log(`   ${response.data.message}`);
        } else {
            console.log(`❌ Bulk User Operation: FAILED - ${response.data.error}`);
        }
    } catch (error) {
        console.log(`❌ Bulk User Operation: ERROR - ${error.response?.data?.error || error.message}`);
    }

    // Test system config update
    try {
        console.log('\n🔧 Testing System Config Update...');
        const response = await axios.put(`${BASE_URL}/admin/config`, {
            section: 'general',
            settings: {
                siteName: 'ToolLink Management System - Updated',
                version: '1.0.1'
            }
        }, { headers });

        if (response.data.success) {
            console.log('✅ System Config Update: PASSED');
            console.log(`   ${response.data.message}`);
        } else {
            console.log(`❌ System Config Update: FAILED - ${response.data.error}`);
        }
    } catch (error) {
        console.log(`❌ System Config Update: ERROR - ${error.response?.data?.error || error.message}`);
    }

    console.log('\n📊 Admin Functions Test Complete');
}

// Run the test
testAdminFunctions().catch(console.error);
