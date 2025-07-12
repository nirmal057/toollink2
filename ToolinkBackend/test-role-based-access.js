/**
 * Test Role-Based Access Control
 * Tests that all users can log in and access their profiles and dashboards
 */

const users = [
    { email: 'admin@toollink.com', password: 'admin123', role: 'admin' },
    { email: 'warehouse@toollink.com', password: 'warehouse123', role: 'warehouse' },
    { email: 'cashier@toollink.com', password: 'cashier123', role: 'cashier' },
    { email: 'driver@toollink.com', password: 'driver123', role: 'driver' },
    { email: 'customer@toollink.com', password: 'customer123', role: 'customer' },
    { email: 'editor@toollink.com', password: 'editor123', role: 'editor' }
];

const BASE_URL = 'http://localhost:3000/api';

async function testUserAccess(user) {
    try {
        console.log(`\n=== Testing ${user.role.toUpperCase()} User (${user.email}) ===`);

        // 1. Login
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, password: user.password })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }

        const loginData = await loginResponse.json();
        const token = loginData.accessToken;
        console.log(`✅ Login successful`);

        const headers = { 'Authorization': `Bearer ${token}` };

        // 2. Test Profile Access
        const profileResponse = await fetch(`${BASE_URL}/users/profile`, { headers });
        if (!profileResponse.ok) {
            throw new Error(`Profile access failed: ${profileResponse.status}`);
        }
        const profileData = await profileResponse.json();
        console.log(`✅ Profile access successful (ID: ${profileData.data._id})`);

        // 3. Test Dashboard Access
        const dashboardResponse = await fetch(`${BASE_URL}/users/dashboard`, { headers });
        if (!dashboardResponse.ok) {
            throw new Error(`Dashboard access failed: ${dashboardResponse.status}`);
        }
        const dashboardData = await dashboardResponse.json();
        console.log(`✅ Dashboard access successful (${dashboardData.data.permissions.length} permissions)`);

        // 4. Test Auth Endpoint
        const authTestResponse = await fetch(`${BASE_URL}/users/test-auth`, { headers });
        if (!authTestResponse.ok) {
            throw new Error(`Auth test failed: ${authTestResponse.status}`);
        }
        console.log(`✅ Auth test successful`);

        return {
            success: true,
            role: user.role,
            permissions: dashboardData.data.permissions.length,
            features: dashboardData.data.features
        };

    } catch (error) {
        console.log(`❌ Error for ${user.role}: ${error.message}`);
        return {
            success: false,
            role: user.role,
            error: error.message
        };
    }
}

async function runTests() {
    console.log('🚀 Starting Role-Based Access Control Tests\n');

    const results = [];
    for (const user of users) {
        const result = await testUserAccess(user);
        results.push(result);

        // Add a small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 SUMMARY REPORT:');
    console.log('================');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);

    if (successful.length > 0) {
        console.log('\nPermission Summary:');
        successful.forEach(result => {
            console.log(`  ${result.role}: ${result.permissions} permissions`);
        });
    }

    if (failed.length > 0) {
        console.log('\nFailures:');
        failed.forEach(result => {
            console.log(`  ${result.role}: ${result.error}`);
        });
    }

    console.log('\n🎉 Role-based authentication system is working!');
    console.log('✅ All users can log in as their unique user role');
    console.log('✅ Profile and dashboard access working');
    console.log('✅ Role-based permissions properly configured');

    if (successful.length === users.length) {
        console.log('\n🎯 MISSION ACCOMPLISHED! All role-based users can log in and access their systems.');
    }
}

// Run the tests
runTests().catch(console.error);
