import fetch from 'node-fetch';

async function debugOrdersAPI() {
    console.log('🔍 Debugging Orders API...\n');

    try {
        // Step 1: Login as admin
        console.log('👤 Step 1: Admin Login...');
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

        const loginData = await loginResponse.json();

        if (!loginData.success) {
            throw new Error('Admin login failed: ' + loginData.message);
        }

        console.log('✅ Admin logged in successfully');
        const token = loginData.token;

        // Step 2: Debug orders fetch
        console.log('\n📋 Step 2: Debugging orders fetch...');
        const ordersResponse = await fetch('http://localhost:3000/api/orders', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        console.log(`Response status: ${ordersResponse.status}`);
        console.log(`Response status text: ${ordersResponse.statusText}`);

        const responseText = await ordersResponse.text();
        console.log(`Raw response: ${responseText}`);

        try {
            const ordersData = JSON.parse(responseText);
            console.log('Parsed response:', JSON.stringify(ordersData, null, 2));
        } catch (parseError) {
            console.error('Failed to parse JSON:', parseError.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugOrdersAPI();
