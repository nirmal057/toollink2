const http = require('http');

// Simple test for bulk operation only
function testBulkOperation() {
    return new Promise((resolve, reject) => {
        // Login first
        const loginData = JSON.stringify({
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        const loginOptions = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData)
            }
        };

        const loginReq = http.request(loginOptions, (loginRes) => {
            let loginResponse = '';

            loginRes.on('data', (chunk) => {
                loginResponse += chunk;
            });

            loginRes.on('end', () => {
                try {
                    const loginParsed = JSON.parse(loginResponse);
                    if (!loginParsed.success) {
                        console.log('❌ Login failed:', loginParsed.error);
                        resolve(false);
                        return;
                    }

                    const token = loginParsed.accessToken;
                    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');

                    // Now test bulk operation
                    const bulkData = JSON.stringify({
                        operation: 'activate',
                        userIds: [4, 5], // Just test with users 4 and 5
                        data: {}
                    });

                    const bulkOptions = {
                        hostname: 'localhost',
                        port: 5000,
                        path: '/api/admin/users/bulk',
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(bulkData)
                        }
                    };

                    console.log('🔧 Testing bulk operation...');
                    const bulkReq = http.request(bulkOptions, (bulkRes) => {
                        let bulkResponse = '';

                        bulkRes.on('data', (chunk) => {
                            bulkResponse += chunk;
                        });

                        bulkRes.on('end', () => {
                            try {
                                const bulkParsed = JSON.parse(bulkResponse);
                                console.log('Response status:', bulkRes.statusCode);
                                console.log('Response data:', JSON.stringify(bulkParsed, null, 2));
                                
                                if (bulkParsed.success) {
                                    console.log('✅ Bulk operation successful!');
                                } else {
                                    console.log('❌ Bulk operation failed:', bulkParsed.error);
                                }
                                resolve(bulkParsed.success);
                            } catch (error) {
                                console.log('❌ Parse error:', error);
                                console.log('Raw response:', bulkResponse);
                                resolve(false);
                            }
                        });
                    });

                    bulkReq.on('error', (error) => {
                        console.log('❌ Bulk request error:', error);
                        resolve(false);
                    });

                    bulkReq.write(bulkData);
                    bulkReq.end();

                } catch (error) {
                    console.log('❌ Login parse error:', error);
                    resolve(false);
                }
            });
        });

        loginReq.on('error', (error) => {
            console.log('❌ Login request error:', error);
            resolve(false);
        });

        loginReq.write(loginData);
        loginReq.end();
    });
}

testBulkOperation().then(success => {
    if (success) {
        console.log('\n🎉 Bulk operation test completed successfully!');
    } else {
        console.log('\n❌ Bulk operation test failed');
    }
}).catch(error => {
    console.error('❌ Test error:', error);
});
