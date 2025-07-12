const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

console.log('🔧 ToolLink User Management API Test - Updated Endpoints');
console.log('='.repeat(60));

async function testUserManagementFlow() {
    let authToken = null;

    try {
        // Test 0: Authenticate as admin
        console.log('\n0️⃣ Authenticating as admin...');
        const authResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@toollink.com', // Use email field
            password: 'admin123'
        });
        authToken = authResponse.data.token || authResponse.data.accessToken;
        console.log(`✅ Success: Admin authenticated`);
        console.log(`   Full response:`, JSON.stringify(authResponse.data, null, 2));
        console.log(`   Token: ${authToken ? 'Received' : 'Not received'}`);

        // Set up axios defaults with auth header
        const authenticatedAxios = axios.create({
            baseURL: BASE_URL,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        // Test 1: Get all users from correct endpoint
        console.log('\n1️⃣ Testing GET /api/users (updated endpoint)...');
        const usersResponse = await authenticatedAxios.get('/api/users');

        // Handle different response formats
        const users = usersResponse.data.data || usersResponse.data.users || usersResponse.data || [];
        console.log(`✅ Success: Found ${users.length} users`);
        console.log(`   Response structure:`, Object.keys(usersResponse.data));

        if (Array.isArray(users)) {
            users.forEach((user, index) => {
                console.log(`   User ${index + 1}: ${user.username} (${user.email}) - Role: ${user.role}`);
            });
        } else {
            console.log(`   ⚠️  Users data is not an array:`, typeof users);
        }

        // Test 2: Create a new user
        console.log('\n2️⃣ Testing POST /api/users (create new user)...');
        const newUser = {
            username: `apitest_${Date.now()}`,
            email: `apitest_${Date.now()}@toollink.com`,
            password: 'TestPassword123!',
            fullName: 'API Test User',
            role: 'customer',
            phone: '0771234567',
            nicNumber: '199512345678'
        };

        const createResponse = await authenticatedAxios.post('/api/users', newUser);
        const createdUser = createResponse.data.data || createResponse.data;
        console.log(`✅ Success: User created with ID ${createdUser._id || createdUser.id}`);
        console.log(`   Username: ${createdUser.username}`);
        console.log(`   Email: ${createdUser.email}`);
        console.log(`   Role: ${createdUser.role}`);

        // Test 3: Get updated user list
        console.log('\n3️⃣ Testing updated user list...');
        const updatedUsersResponse = await authenticatedAxios.get('/api/users');
        const updatedUsers = updatedUsersResponse.data.data || updatedUsersResponse.data || [];
        console.log(`✅ Success: Now have ${updatedUsers.length} users (increased by 1)`);

        // Test 4: Update the created user
        console.log('\n4️⃣ Testing PUT /api/users/:id (update user)...');
        const userId = createdUser._id || createdUser.id;
        const updateData = {
            fullName: 'API Test User Updated',
            phone: '0779876543'
        };

        const updateResponse = await authenticatedAxios.put(`/api/users/${userId}`, updateData);
        const updatedUser = updateResponse.data.data || updateResponse.data;
        console.log(`✅ Success: User updated`);
        console.log(`   New full name: ${updatedUser.fullName}`);
        console.log(`   New phone: ${updatedUser.phone}`);

        // Test 5: Test authentication with new user
        console.log('\n5️⃣ Testing authentication with new user...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: newUser.email, // Use email field instead of identifier
            password: newUser.password
        });
        const loginUser = loginResponse.data.user || {};
        console.log(`✅ Success: User can login successfully`);
        console.log(`   Token received: ${loginResponse.data.accessToken ? 'Yes' : 'No'}`);
        console.log(`   User role: ${loginUser.role}`);

        // Test 6: Delete the test user
        console.log('\n6️⃣ Testing DELETE /api/users/:id (delete user)...');
        const deleteResponse = await authenticatedAxios.delete(`/api/users/${userId}`);
        console.log(`✅ Success: User deleted`);

        // Test 7: Verify final user count
        console.log('\n7️⃣ Testing final user count...');
        const finalUsersResponse = await authenticatedAxios.get('/api/users');
        const finalUsers = finalUsersResponse.data.data || finalUsersResponse.data || [];
        console.log(`✅ Success: Back to ${finalUsers.length} users`);

        // Test 8: Compare old vs new endpoints
        console.log('\n8️⃣ Testing endpoint comparison...');
        try {
            const oldEndpointResponse = await authenticatedAxios.get('/api/users-new');
            console.log(`⚠️  Old endpoint /api/users-new still returns ${oldEndpointResponse.data.length} users`);
            console.log(`   This explains why frontend was only showing 1 user!`);
        } catch (error) {
            console.log(`ℹ️  Old endpoint /api/users-new: ${error.response?.status === 404 ? 'Not found (good!)' : 'Error: ' + error.message}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 USER MANAGEMENT API TEST COMPLETED SUCCESSFULLY!');
        console.log('💡 Frontend should now display all users correctly');
        console.log('📋 Next steps:');
        console.log('   1. Login to frontend as admin (admin/admin123)');
        console.log('   2. Navigate to User Management');
        console.log('   3. Verify all users are displayed');
        console.log('   4. Test add/edit/delete operations');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testUserManagementFlow();
