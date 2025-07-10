const fetch = require('node-fetch');

async function testOrdersAPI() {
    try {
        console.log('🔐 Testing authentication...');

        // Step 1: Login
        const authResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin1@toollink.lk',
                password: 'toollink123'
            })
        });

        if (!authResponse.ok) {
            throw new Error(`Login failed: ${authResponse.status}`);
        }

        const authData = await authResponse.json();
        console.log('✅ Login successful');
        console.log('👤 User:', authData.user?.email, authData.user?.role);
        console.log('🔑 Token received:', !!authData.accessToken);

        // Step 2: Fetch orders
        console.log('\n📦 Testing orders API...');
        const ordersResponse = await fetch('http://localhost:5000/api/orders?limit=10', {
            headers: {
                'Authorization': `Bearer ${authData.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📊 Orders response status:', ordersResponse.status);

        if (!ordersResponse.ok) {
            const errorText = await ordersResponse.text();
            console.error('❌ Orders API error:', errorText);
            return;
        }

        const ordersData = await ordersResponse.json();
        console.log('✅ Orders API successful');
        console.log('📋 Orders found:', ordersData.data?.orders?.length || 0);

        if (ordersData.data?.orders?.length > 0) {
            console.log('\n🔍 Sample order:');
            const sampleOrder = ordersData.data.orders[0];
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
