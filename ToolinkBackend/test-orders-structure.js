import fetch from 'node-fetch';

async function testOrdersStructure() {
    const baseUrl = 'http://localhost:3000/api';

    try {
        // 1. Login to get token
        const loginResponse = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@toollink.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.accessToken;

        // 2. Fetch orders and examine structure
        console.log('🔍 Fetching orders structure...');
        const ordersResponse = await fetch(`${baseUrl}/orders?limit=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const ordersData = await ordersResponse.json();
        console.log('Raw response structure:');
        console.log(JSON.stringify(ordersData, null, 2));

        if (ordersData.success && ordersData.data?.length > 0) {
            console.log('\n📋 Sample order structure:');
            const sampleOrder = ordersData.data[0];
            console.log(JSON.stringify(sampleOrder, null, 2));
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testOrdersStructure();
