const https = require('https');
const http = require('http');
const { URL } = require('url');

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const lib = urlObj.protocol === 'https:' ? https : http;

        const req = lib.request(urlObj, {
            method: options.method || 'GET',
            headers: options.headers || {},
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

async function testOrdersAPI() {
    try {
        console.log('🔐 Testing authentication...');

        // Step 1: Login
        const authResult = await makeRequest('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@toollink.com',
                password: 'admin123'
            })
        });

        if (authResult.status !== 200) {
            throw new Error(`Login failed: ${authResult.status}`);
        }

        console.log('✅ Login successful');
        console.log('👤 User:', authResult.data.user?.email, authResult.data.user?.role);
        console.log('🔑 Token received:', !!authResult.data.accessToken);

        // Step 2: Fetch orders
        console.log('\n📦 Testing orders API...');
        const ordersResult = await makeRequest('http://localhost:5000/api/orders?limit=10', {
            headers: {
                'Authorization': `Bearer ${authResult.data.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📊 Orders response status:', ordersResult.status);

        if (ordersResult.status !== 200) {
            console.error('❌ Orders API error:', ordersResult.data);
            return;
        }

        console.log('✅ Orders API successful');
        console.log('📋 Orders found:', ordersResult.data.data?.orders?.length || 0);

        if (ordersResult.data.data?.orders?.length > 0) {
            console.log('\n🔍 Sample order:');
            const sampleOrder = ordersResult.data.data.orders[0];
            console.log('- Order Number:', sampleOrder.orderNumber);
            console.log('- Customer:', sampleOrder.customerName);
            console.log('- Status:', sampleOrder.status);
            console.log('- Items:', sampleOrder.items?.length || 0);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testOrdersAPI();
