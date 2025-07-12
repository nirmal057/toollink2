import fetch from 'node-fetch';

async function testSimpleAPI() {
    console.log('🔄 Testing Simple API Endpoints...\n');

    try {
        // Test server health
        console.log('🏥 Testing server health...');
        const healthResponse = await fetch('http://localhost:3000/api/auth/health', {
            method: 'GET'
        });

        if (healthResponse.status === 404) {
            console.log('⚠️ Health endpoint not found, trying direct connection...');
        } else {
            const healthData = await healthResponse.text();
            console.log('Health response:', healthData);
        }

        // Test login
        console.log('\n👤 Testing login...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@toollink.com',
                password: 'admin123'
            })
        });

        console.log(`Login Status: ${loginResponse.status}`);
        const loginText = await loginResponse.text();
        console.log('Login Response:', loginText);

        try {
            const loginData = JSON.parse(loginText);
            if (loginData.success && loginData.accessToken) {
                console.log('✅ Login successful');
                console.log('🔑 Token received:', loginData.accessToken.substring(0, 50) + '...');

                // Test orders with this token
                console.log('\n📋 Testing orders endpoint...');
                const ordersResponse = await fetch('http://localhost:3000/api/orders', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${loginData.accessToken}`,
                        'Content-Type': 'application/json',
                    }
                });

                console.log(`Orders Status: ${ordersResponse.status}`);
                const ordersText = await ordersResponse.text();
                console.log('Orders Response:', ordersText);

            } else {
                console.log('❌ Login failed:', loginData.message);
            }
        } catch (parseError) {
            console.error('❌ Failed to parse login response:', parseError.message);
        }

    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

testSimpleAPI();
