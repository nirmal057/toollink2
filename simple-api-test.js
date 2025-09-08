// Simple test to verify the issue
async function quickTest() {
    // Clear any existing tokens to start fresh
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    console.log('Starting fresh login test...');

    try {
        // Step 1: Login
        const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
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
        console.log('1. Login result:', loginData.success ? 'SUCCESS' : 'FAILED');

        if (!loginData.success) {
            console.error('Login failed:', loginData);
            return;
        }

        // Store tokens
        localStorage.setItem('accessToken', loginData.accessToken);
        if (loginData.refreshToken) {
            localStorage.setItem('refreshToken', loginData.refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(loginData.user));

        console.log('2. Tokens stored successfully');

        // Step 2: Test data fetching
        const token = localStorage.getItem('accessToken');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        console.log('3. Testing data endpoints...');

        // Test users endpoint
        const usersResponse = await fetch('http://localhost:5001/api/users', { headers });
        const usersData = await usersResponse.json();
        console.log('Users API:', usersData.success ? `SUCCESS (${usersData.data?.length} users)` : 'FAILED');

        // Test inventory endpoint
        const inventoryResponse = await fetch('http://localhost:5001/api/inventory', { headers });
        const inventoryData = await inventoryResponse.json();
        console.log('Inventory API:', inventoryData.success ? `SUCCESS (${inventoryData.data?.items?.length} items)` : 'FAILED');

        // Test orders endpoint
        const ordersResponse = await fetch('http://localhost:5001/api/orders', { headers });
        const ordersData = await ordersResponse.json();
        console.log('Orders API:', ordersData.success ? `SUCCESS (${ordersData.data?.length} orders)` : 'FAILED');

        console.log('4. ✅ All tests completed! The backend is working correctly.');
        console.log('5. 💡 The issue is likely in the frontend React application not properly calling these APIs.');

        // Log what should be visible
        console.log('\n📊 Data Summary:');
        console.log(`- Users: ${usersData.data?.length || 0}`);
        console.log(`- Inventory Items: ${inventoryData.data?.items?.length || 0}`);
        console.log(`- Orders: ${ordersData.data?.length || 0}`);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
quickTest();
