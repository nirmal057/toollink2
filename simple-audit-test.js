const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function simpleAuditTest() {
    console.log('🔍 Simple Audit Test...\n');

    try {
        // Login first
        console.log('1. Login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));

        if (loginResponse.data.success && loginResponse.data.accessToken) {
            const token = loginResponse.data.accessToken;
            console.log('Token received:', token.substring(0, 20) + '...');

            // Test audit logs endpoint
            console.log('\n2. Getting audit logs...');
            const auditResponse = await axios.get(`${API_BASE}/admin/audit-logs`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Audit logs response:', JSON.stringify(auditResponse.data, null, 2));
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
    }
}

simpleAuditTest();
