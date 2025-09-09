// Test script to verify admin dashboard API
const testAdminAPI = async () => {
    try {
        // Login first
        const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@toollink.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        console.log('🔐 Login response:', loginData);

        if (!loginData.success) {
            throw new Error('Login failed: ' + loginData.error);
        }

        const token = loginData.accessToken;

        // Test admin dashboard endpoint
        const dashboardResponse = await fetch('http://localhost:5001/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const dashboardData = await dashboardResponse.json();
        console.log('📊 Dashboard API response:', JSON.stringify(dashboardData, null, 2));

        // Test individual endpoints
        const usersResponse = await fetch('http://localhost:5001/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const usersData = await usersResponse.json();
        console.log('👥 Users count from /users endpoint:', usersData.data?.length || 'Error');

        console.log('✅ API test completed successfully');

    } catch (error) {
        console.error('❌ API test failed:', error);
    }
};

testAdminAPI();
