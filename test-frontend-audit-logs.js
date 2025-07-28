const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testFrontendAuditLogs() {
    console.log('🔍 Testing Frontend Audit Logs Integration...\n');

    try {
        // Login to get token
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        if (loginResponse.data.success && loginResponse.data.accessToken) {
            const token = loginResponse.data.accessToken;
            console.log('✅ Login successful\n');

            // Test the exact API call that the frontend makes
            console.log('📡 Testing frontend audit logs API call...');
            const auditResponse = await axios.get(`${API_BASE}/admin/audit-logs?page=1&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (auditResponse.data.success) {
                console.log('✅ Audit logs API call successful\n');

                const auditLogs = auditResponse.data.data;
                console.log(`📊 API Response Structure:`);
                console.log(`- Total logs: ${auditLogs.length}`);
                console.log(`- Pagination: ${JSON.stringify(auditResponse.data.pagination || 'Not provided')}\n`);

                // Test first few logs to see the structure that frontend will receive
                console.log('📋 Sample Audit Log Entries (what frontend receives):');
                auditLogs.slice(0, 3).forEach((log, index) => {
                    console.log(`\n${index + 1}. Log Entry:`);
                    console.log(`   - ID: ${log._id}`);
                    console.log(`   - Action: ${log.action}`);
                    console.log(`   - User: ${log.userId ? (log.userId.fullName || log.userId.email) : 'System'}`);
                    console.log(`   - Status: ${log.status}`);
                    console.log(`   - Timestamp: ${new Date(log.timestamp).toLocaleString()}`);
                    console.log(`   - IP: ${log.ipAddress}`);
                    console.log(`   - Details: ${JSON.stringify(log.details)}`);
                });

                // Test status breakdown
                const statusBreakdown = auditLogs.reduce((acc, log) => {
                    acc[log.status] = (acc[log.status] || 0) + 1;
                    return acc;
                }, {});

                console.log(`\n📈 Status Breakdown:`);
                Object.entries(statusBreakdown).forEach(([status, count]) => {
                    console.log(`   - ${status}: ${count} logs`);
                });

                // Test action breakdown
                const actionBreakdown = auditLogs.reduce((acc, log) => {
                    acc[log.action] = (acc[log.action] || 0) + 1;
                    return acc;
                }, {});

                console.log(`\n🎯 Action Breakdown:`);
                Object.entries(actionBreakdown).forEach(([action, count]) => {
                    console.log(`   - ${action}: ${count} logs`);
                });

                console.log(`\n✅ Frontend audit logs integration test completed successfully!`);
                console.log(`\n🔧 Frontend should now be able to:`);
                console.log(`   1. Display all audit logs with proper status indicators`);
                console.log(`   2. Show user names correctly`);
                console.log(`   3. Format timestamps properly`);
                console.log(`   4. Display detailed information in structured format`);
                console.log(`   5. Filter by action type`);
                console.log(`   6. Show success/failure status with proper icons`);

            } else {
                console.log('❌ Audit logs API call failed');
            }

        } else {
            console.log('❌ Login failed');
        }

    } catch (error) {
        console.error('❌ Error during testing:', error.response?.data || error.message);
    }
}

testFrontendAuditLogs();
