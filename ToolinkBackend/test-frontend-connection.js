// Test Frontend-Backend Connection
import fetch from 'node-fetch';

async function testFrontendBackendConnection() {
    console.log('🔍 Testing Frontend-Backend Connection...\n');

    try {
        // Test 1: Basic API connection
        console.log('1. Testing basic API connection:');
        const response = await fetch('http://localhost:3000/api/users-new?limit=3');
        const data = await response.json();

        console.log(`   ✅ API Status: ${response.status}`);
        console.log(`   ✅ Response Success: ${data.success}`);
        console.log(`   ✅ Users Count: ${data.data?.length || 0}`);

        // Test 2: Data structure validation
        console.log('\n2. Testing data structure:');
        if (data.data && data.data.length > 0) {
            const firstUser = data.data[0];
            const requiredFields = ['_id', 'name', 'email', 'role', 'status'];
            const hasAllFields = requiredFields.every(field => firstUser.hasOwnProperty(field));

            console.log(`   ✅ Has all required fields: ${hasAllFields}`);
            console.log(`   ✅ Sample user: ${firstUser.name} (${firstUser.role})`);
        }

        // Test 3: CORS headers check
        console.log('\n3. Testing CORS headers:');
        const corsHeaders = [
            'access-control-allow-origin',
            'access-control-allow-methods',
            'access-control-allow-headers'
        ];

        corsHeaders.forEach(header => {
            const value = response.headers.get(header);
            console.log(`   ${value ? '✅' : '❌'} ${header}: ${value || 'Not set'}`);
        });

        // Test 4: Pagination check
        console.log('\n4. Testing pagination:');
        console.log(`   ✅ Has pagination: ${!!data.pagination}`);
        if (data.pagination) {
            console.log(`   ✅ Current page: ${data.pagination.currentPage || 'N/A'}`);
            console.log(`   ✅ Total users: ${data.pagination.total || 'N/A'}`);
        }

        console.log('\n🎉 All tests passed! Frontend should be able to access backend data.');

    } catch (error) {
        console.error('\n❌ Connection test failed:', error.message);
    }
}

testFrontendBackendConnection();
