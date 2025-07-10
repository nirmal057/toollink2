const http = require('http');

// Test admin login with native HTTP
function testAdminLogin() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    console.log('Response status:', res.statusCode);
                    console.log('Response data:', JSON.stringify(parsed, null, 2));
                    
                    if (parsed.success && parsed.accessToken) {
                        console.log('✅ Login successful!');
                        resolve(parsed.accessToken);
                    } else {
                        console.log('❌ Login failed:', parsed.error);
                        resolve(null);
                    }
                } catch (error) {
                    console.log('❌ Parse error:', error);
                    console.log('Raw response:', responseData);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Request error:', error);
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// Test admin dashboard
function testAdminDashboard(token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/admin/dashboard',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    console.log('\n📊 Admin Dashboard Test:');
                    console.log('Response status:', res.statusCode);
                    
                    if (parsed.success) {
                        console.log('✅ Admin Dashboard: PASSED');
                        console.log('Dashboard data keys:', Object.keys(parsed.dashboard || {}));
                        if (parsed.dashboard && parsed.dashboard.userStats) {
                            console.log('User stats:', parsed.dashboard.userStats);
                        }
                    } else {
                        console.log('❌ Admin Dashboard: FAILED -', parsed.error);
                    }
                    resolve(parsed);
                } catch (error) {
                    console.log('❌ Parse error:', error);
                    console.log('Raw response:', responseData);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Request error:', error);
            reject(error);
        });

        req.end();
    });
}

// Test admin analytics
function testAdminAnalytics(token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/admin/analytics',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    console.log('\n📈 Admin Analytics Test:');
                    console.log('Response status:', res.statusCode);
                    
                    if (parsed.success) {
                        console.log('✅ Admin Analytics: PASSED');
                        console.log('Analytics data keys:', Object.keys(parsed.analytics || {}));
                    } else {
                        console.log('❌ Admin Analytics: FAILED -', parsed.error);
                    }
                    resolve(parsed);
                } catch (error) {
                    console.log('❌ Parse error:', error);
                    console.log('Raw response:', responseData);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Request error:', error);
            reject(error);
        });

        req.end();
    });
}

// Run tests
async function runAdminTests() {
    console.log('🔧 Testing Admin Functions with Native HTTP...\n');
    
    try {
        const token = await testAdminLogin();
        
        if (token) {
            await testAdminDashboard(token);
            await testAdminAnalytics(token);
            console.log('\n🎉 Admin Functions Test Complete!');
        } else {
            console.log('\n❌ Cannot proceed without valid token');
        }
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

runAdminTests();
