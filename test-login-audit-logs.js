// Test script to verify audit logging for login/logout
const axios = require('axios');
const baseURL = 'http://localhost:5000/api';

async function testLoginAuditLogs() {
    console.log('🔍 Testing Login Audit Logs\n');

    try {
        // Test 1: Successful login
        console.log('1️⃣ Testing successful login...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        if (loginResponse.data.success) {
            console.log('✅ Login successful');
            const token = loginResponse.data.accessToken;
            const refreshToken = loginResponse.data.refreshToken;

            // Test 2: Check audit logs for login
            console.log('\n2️⃣ Checking audit logs for login...');
            const auditResponse = await axios.get(`${baseURL}/admin/audit-logs?action=user_login&limit=5`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (auditResponse.data.success && auditResponse.data.data) {
                const loginLogs = auditResponse.data.data.filter(log =>
                    log.action === 'user_login' &&
                    log.details.action === 'login_success'
                );

                if (loginLogs.length > 0) {
                    console.log('✅ Login audit log found:');
                    console.log(`   - Action: ${loginLogs[0].action}`);
                    console.log(`   - Status: ${loginLogs[0].status}`);
                    console.log(`   - Details: ${JSON.stringify(loginLogs[0].details)}`);
                    console.log(`   - IP: ${loginLogs[0].ipAddress}`);
                    console.log(`   - Timestamp: ${loginLogs[0].timestamp}`);
                } else {
                    console.log('❌ No login audit logs found');
                }
            }

            // Test 3: Logout and check audit logs
            console.log('\n3️⃣ Testing logout...');
            const logoutResponse = await axios.post(`${baseURL}/auth/logout`, {
                refreshToken: refreshToken
            });

            if (logoutResponse.data.success) {
                console.log('✅ Logout successful');

                // Check for logout audit logs
                console.log('\n4️⃣ Checking audit logs for logout...');
                const logoutAuditResponse = await axios.get(`${baseURL}/admin/audit-logs?action=user_logout&limit=5`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (logoutAuditResponse.data.success && logoutAuditResponse.data.data) {
                    const logoutLogs = logoutAuditResponse.data.data.filter(log =>
                        log.action === 'user_logout' &&
                        log.details.action === 'logout_success'
                    );

                    if (logoutLogs.length > 0) {
                        console.log('✅ Logout audit log found:');
                        console.log(`   - Action: ${logoutLogs[0].action}`);
                        console.log(`   - Status: ${logoutLogs[0].status}`);
                        console.log(`   - Details: ${JSON.stringify(logoutLogs[0].details)}`);
                    } else {
                        console.log('❌ No logout audit logs found');
                    }
                }
            }

        } else {
            console.log('❌ Login failed');
        }

        // Test 4: Failed login attempt
        console.log('\n5️⃣ Testing failed login...');
        try {
            await axios.post(`${baseURL}/auth/login`, {
                email: 'admin@toollink.com',
                password: 'wrongpassword'
            });
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Failed login attempt registered');

                // Check for failed login audit logs (need a valid token first)
                const validLogin = await axios.post(`${baseURL}/auth/login`, {
                    email: 'admin@toollink.com',
                    password: 'admin123'
                });

                if (validLogin.data.success) {
                    const token = validLogin.data.accessToken;

                    console.log('\n6️⃣ Checking audit logs for failed login...');
                    const failedAuditResponse = await axios.get(`${baseURL}/admin/audit-logs?limit=10`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (failedAuditResponse.data.success && failedAuditResponse.data.data) {
                        const failedLogs = failedAuditResponse.data.data.filter(log =>
                            log.action === 'user_login' &&
                            log.details.action === 'login_failed'
                        );

                        if (failedLogs.length > 0) {
                            console.log('✅ Failed login audit log found:');
                            console.log(`   - Action: ${failedLogs[0].action}`);
                            console.log(`   - Status: ${failedLogs[0].status}`);
                            console.log(`   - Reason: ${failedLogs[0].details.reason}`);
                            console.log(`   - Details: ${JSON.stringify(failedLogs[0].details)}`);
                        } else {
                            console.log('❌ No failed login audit logs found');
                        }
                    }
                }
            }
        }

        console.log('\n✅ Login audit logging test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response?.data) {
            console.error('   Response:', error.response.data);
        }
    }
}

// Run the test
testLoginAuditLogs();
