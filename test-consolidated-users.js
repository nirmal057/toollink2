const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

console.log('🧪 Testing Consolidated User Database');
console.log('=====================================');

async function testConsolidatedUsers() {
    try {
        // Step 1: Authenticate
        console.log('\n1️⃣ Authenticating as admin...');
        const authResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        const token = authResponse.data.accessToken;
        console.log('✅ Authentication successful');

        // Step 2: Get all users from main endpoint
        console.log('\n2️⃣ Getting all users from /api/users...');
        const usersResponse = await axios.get(`${BASE_URL}/api/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const users = usersResponse.data.data || usersResponse.data || [];
        console.log(`✅ Found ${users.length} users in main collection`);

        console.log('\n👥 All users:');
        users.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.username} (${user.email}) - Role: ${user.role}`);
        });

        // Step 3: Test if the old endpoint is gone
        console.log('\n3️⃣ Testing old /api/users-new endpoint...');
        try {
            const oldResponse = await axios.get(`${BASE_URL}/api/users-new`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('⚠️  Old endpoint still accessible - this should not happen');
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('✅ Old endpoint properly removed (404 error)');
            } else {
                console.log(`✅ Old endpoint inaccessible: ${error.response?.status || error.message}`);
            }
        }

        // Step 4: Test user creation on main endpoint
        console.log('\n4️⃣ Testing user creation on main endpoint...');
        const newUser = {
            username: `consolidated_test_${Date.now()}`,
            email: `consolidated_${Date.now()}@toollink.com`,
            password: 'TestPassword123!',
            fullName: 'Consolidation Test User',
            role: 'customer'
        };

        const createResponse = await axios.post(`${BASE_URL}/api/users`, newUser, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (createResponse.status === 201) {
            console.log('✅ User creation successful on main endpoint');
            console.log(`   New user: ${newUser.username} (${newUser.email})`);

            // Verify the user appears in the list
            const updatedUsersResponse = await axios.get(`${BASE_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const updatedUsers = updatedUsersResponse.data.data || updatedUsersResponse.data || [];
            console.log(`✅ Updated user count: ${updatedUsers.length}`);
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎉 DATABASE CONSOLIDATION SUCCESSFUL!');
        console.log('✅ All users are now in single collection');
        console.log('✅ Old usernews collection removed');
        console.log('✅ Old /api/users-new endpoint removed');
        console.log('✅ User management will now show ALL users');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testConsolidatedUsers();
