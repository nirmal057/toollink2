// Quick test to verify API without rate limiting
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

async function testSuperAdmin() {
    try {
        console.log('🔐 Testing superadmin authentication...');

        // Test superadmin login
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

        console.log('Auth status:', authResult.status);

        if (authResult.status === 200) {
            console.log('✅ Superadmin login successful');
            console.log('Token:', !!authResult.data.accessToken);

            // Now test orders API
            console.log('\n📦 Testing orders API...');
            const ordersResult = await makeRequest('http://localhost:5000/api/orders?limit=3', {
                headers: {
                    'Authorization': `Bearer ${authResult.data.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Orders status:', ordersResult.status);

            if (ordersResult.status === 200) {
                console.log('✅ Orders API successful');
                console.log('Orders found:', ordersResult.data.data?.orders?.length || 0);

                if (ordersResult.data.data?.orders?.length > 0) {
                    const order = ordersResult.data.data.orders[0];
                    console.log('\n🔍 Sample order:');
                    console.log('- Order Number:', order.orderNumber);
                    console.log('- Customer:', order.customerName);
                    console.log('- Status:', order.status);
                    console.log('- Items:', order.items?.length || 0);

                    // Transform like frontend does
                    const transformedOrder = {
                        id: order.orderNumber || order._id,
                        customer: order.customerName || order.customer?.name || 'Unknown Customer',
                        items: order.items?.map(item => ({
                            name: item.materialName || item.name || 'Unknown Item',
                            quantity: item.quantity || 0
                        })) || [],
                        status: order.status,
                        date: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                    };

                    console.log('\n🎯 Transformed for frontend:');
                    console.log('- ID:', transformedOrder.id);
                    console.log('- Customer:', transformedOrder.customer);
                    console.log('- Items:', transformedOrder.items.length);
                    console.log('- Status:', transformedOrder.status);
                    console.log('- Date:', transformedOrder.date);
                }

                console.log('\n🎉 API integration test successful!');
                console.log('✅ Authentication works');
                console.log('✅ Orders API works');
                console.log('✅ Data transformation ready');

            } else {
                console.error('❌ Orders API failed:', ordersResult.data);
            }
        } else if (authResult.status === 429) {
            console.log('⏳ Rate limited - try again in a few seconds');
        } else {
            console.error('❌ Login failed:', authResult.data);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSuperAdmin();
