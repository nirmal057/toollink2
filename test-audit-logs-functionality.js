const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAuditLogsFunctionality() {
    console.log('🔍 Testing Audit Logs Functionality...\n');

    try {
        // Test 1: Login (should create audit log)
        console.log('1. Testing login audit logging...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        if (loginResponse.data.success) {
            console.log('✅ Login successful - audit log should be created');
            const token = loginResponse.data.token;

            // Test 2: Profile update (should create audit log)
            console.log('\n2. Testing profile update audit logging...');
            const profileUpdateResponse = await axios.put(`${API_BASE}/users/profile`, {
                name: 'Updated Admin Name',
                phone: '+1234567890'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (profileUpdateResponse.data.success) {
                console.log('✅ Profile update successful - audit log should be created');
            }

            // Test 3: Failed login attempt (should create audit log)
            console.log('\n3. Testing failed login audit logging...');
            try {
                await axios.post(`${API_BASE}/auth/login`, {
                    email: 'admin@toollink.com',
                    password: 'wrongpassword'
                });
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    console.log('✅ Failed login attempt - audit log should be created');
                }
            }

            // Test 4: Get audit logs (admin only)
            console.log('\n4. Testing audit logs retrieval...');
            const auditLogsResponse = await axios.get(`${API_BASE}/admin/audit-logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (auditLogsResponse.data.success) {
                console.log(`✅ Audit logs retrieved successfully`);
                console.log(`📊 Total audit logs: ${auditLogsResponse.data.data.total}`);
                console.log(`📄 Current page logs: ${auditLogsResponse.data.data.auditLogs.length}`);

                // Display recent audit logs
                console.log('\n📋 Recent Audit Logs:');
                auditLogsResponse.data.data.auditLogs.slice(0, 5).forEach((log, index) => {
                    console.log(`${index + 1}. ${log.action} by ${log.userId ? log.userId.name || log.userId.email : 'Unknown'} at ${new Date(log.timestamp).toLocaleString()}`);
                    if (log.details) {
                        console.log(`   Details: ${JSON.stringify(log.details)}`);
                    }
                });
            }

            // Test 5: Logout (should create audit log)
            console.log('\n5. Testing logout audit logging...');
            const logoutResponse = await axios.post(`${API_BASE}/auth/logout`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (logoutResponse.data.success) {
                console.log('✅ Logout successful - audit log should be created');
            }

        } else {
            console.log('❌ Login failed');
        }

    } catch (error) {
        console.error('❌ Error during testing:', error.response?.data || error.message);
    }

    console.log('\n🏁 Audit logs functionality test completed!');
    console.log('\n💡 Next steps:');
    console.log('1. Open the frontend at http://localhost:3000');
    console.log('2. Login as admin (admin@toollink.com / admin123)');
    console.log('3. Navigate to Audit Logs page');
    console.log('4. Verify that audit logs are displayed correctly with proper status indicators');
}

testAuditLogsFunctionality();
