import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

const testUsers = [
    { email: 'admin@toollink.com', password: 'admin123', expectedRole: 'admin' },
    { email: 'warehouse@toollink.com', password: 'warehouse123', expectedRole: 'warehouse' },
    { email: 'cashier@toollink.com', password: 'cashier123', expectedRole: 'cashier' },
    { email: 'driver@toollink.com', password: 'driver123', expectedRole: 'driver' },
    { email: 'customer@toollink.com', password: 'customer123', expectedRole: 'customer' },
    { email: 'editor@toollink.com', password: 'editor123', expectedRole: 'editor' }
];

async function testLogin(email, password, expectedRole) {
    try {
        console.log(`\\n🔐 Testing login for ${email}...`);

        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`✅ LOGIN SUCCESS - Role: ${data.user.role} | Name: ${data.user.fullName}`);

            if (data.user.role === expectedRole) {
                console.log(`✅ Role verification passed`);
            } else {
                console.log(`❌ Role mismatch: expected ${expectedRole}, got ${data.user.role}`);
            }

            // Test a protected endpoint
            const profileResponse = await fetch(`${BASE_URL}/api/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${data.accessToken}`
                }
            });

            if (profileResponse.ok) {
                console.log(`✅ Protected endpoint access successful`);
            } else {
                console.log(`❌ Protected endpoint failed: ${profileResponse.status}`);
            }

            return { success: true, role: data.user.role, token: data.accessToken };
        } else {
            console.log(`❌ LOGIN FAILED: ${data.error} (${response.status})`);
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.log(`❌ LOGIN ERROR: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('🚀 Starting Role-Based Authentication Tests');
    console.log('============================================');

    const results = [];

    for (const user of testUsers) {
        const result = await testLogin(user.email, user.password, user.expectedRole);
        results.push({
            email: user.email,
            expectedRole: user.expectedRole,
            ...result
        });
    }

    console.log('\\n📊 Test Results Summary');
    console.log('========================');

    let successCount = 0;
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const roleMatch = result.role === result.expectedRole ? '✓' : '✗';
        console.log(`${status} ${result.email} (${result.expectedRole}) ${result.success ? roleMatch : ''}`);
        if (result.success) successCount++;
    });

    console.log(`\\nSuccess Rate: ${successCount}/${results.length} (${Math.round(successCount / results.length * 100)}%)`);

    if (successCount === results.length) {
        console.log('\\n🎉 All role-based authentication tests passed!');
        console.log('Users can now log in with their specific roles and access appropriate features.');
    } else {
        console.log('\\n⚠️  Some tests failed. Check the logs above for details.');
    }
}

runTests().catch(console.error);
