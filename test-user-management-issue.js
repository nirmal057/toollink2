#!/usr/bin/env node

/**
 * Test User Management Edit/Delete Functionality
 * This script will test the user management system to identify why edit/delete functions are not working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test credentials
const ADMIN_CREDENTIALS = {
    email: 'admin@toollink.com',
    password: 'admin123'
};

let authToken = null;

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(method, url, data = null) {
    try {
        const config = {
            method: method.toLowerCase(),
            url: `${BASE_URL}${url}`,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || error.message,
            status: error.response?.status,
            responseData: error.response?.data
        };
    }
}

async function testUserManagementFlow() {
    console.log('🔍 Testing User Management Edit/Delete Functionality\n');

    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, ADMIN_CREDENTIALS);
        authToken = loginResponse.data.accessToken;
        console.log('✅ Admin login successful');
        console.log(`   Token: ${authToken.substring(0, 20)}...`);
    } catch (error) {
        console.error('❌ Admin login failed:', error.response?.data?.error || error.message);
        process.exit(1);
    }

    // Step 2: Get list of users
    console.log('\n2️⃣ Fetching user list...');
    const usersResult = await makeAuthenticatedRequest('GET', '/api/users');
    if (!usersResult.success) {
        console.error('❌ Failed to fetch users:', usersResult.error);
        process.exit(1);
    }

    const users = usersResult.data.users || [];
    console.log(`✅ Found ${users.length} users`);

    if (users.length === 0) {
        console.log('⚠️  No users found to test with');
        process.exit(0);
    }

    // Find a non-admin user for testing
    const testUser = users.find(user => user.role !== 'admin' && user.email !== ADMIN_CREDENTIALS.email);
    if (!testUser) {
        console.log('⚠️  No non-admin users found for testing');
        process.exit(0);
    }

    console.log(`   Testing with user: ${testUser.email} (${testUser.role})`);
    console.log(`   User ID: ${testUser._id || testUser.id}`);

    // Step 3: Test GET single user
    console.log('\n3️⃣ Testing single user fetch...');
    const userId = testUser._id || testUser.id;
    const singleUserResult = await makeAuthenticatedRequest('GET', `/api/users/${userId}`);

    if (singleUserResult.success) {
        console.log('✅ Single user fetch successful');
        console.log(`   User data: ${JSON.stringify(singleUserResult.data.user, null, 2)}`);
    } else {
        console.error('❌ Single user fetch failed:', singleUserResult.error);
        console.log('   Status:', singleUserResult.status);
        console.log('   Response:', JSON.stringify(singleUserResult.responseData, null, 2));
    }

    // Step 4: Test user update
    console.log('\n4️⃣ Testing user update...');
    const updateData = {
        fullName: testUser.fullName + ' (Updated)',
        phone: '+94123456789'
    };

    const updateResult = await makeAuthenticatedRequest('PUT', `/api/users/${userId}`, updateData);

    if (updateResult.success) {
        console.log('✅ User update successful');
        console.log(`   Updated user: ${JSON.stringify(updateResult.data.user, null, 2)}`);
    } else {
        console.error('❌ User update failed:', updateResult.error);
        console.log('   Status:', updateResult.status);
        console.log('   Response:', JSON.stringify(updateResult.responseData, null, 2));
    }

    // Step 5: Test user deletion (soft delete)
    console.log('\n5️⃣ Testing user deletion...');
    const deleteResult = await makeAuthenticatedRequest('DELETE', `/api/users/${userId}`);

    if (deleteResult.success) {
        console.log('✅ User deletion successful');
        console.log(`   Delete response: ${JSON.stringify(deleteResult.data, null, 2)}`);
    } else {
        console.error('❌ User deletion failed:', deleteResult.error);
        console.log('   Status:', deleteResult.status);
        console.log('   Response:', JSON.stringify(deleteResult.responseData, null, 2));
    }

    // Step 6: Verify user is soft deleted
    console.log('\n6️⃣ Verifying user soft deletion...');
    const verifyDeleteResult = await makeAuthenticatedRequest('GET', `/api/users/${userId}`);

    if (verifyDeleteResult.success) {
        const user = verifyDeleteResult.data.user;
        console.log('✅ User still exists (soft delete)');
        console.log(`   User status: isActive=${user.isActive}`);

        if (user.isActive === false) {
            console.log('✅ User correctly soft deleted (isActive=false)');
        } else {
            console.log('⚠️  User not properly soft deleted (isActive=true)');
        }
    } else {
        console.error('❌ Failed to verify user deletion:', verifyDeleteResult.error);
    }

    // Step 7: Test frontend API endpoints
    console.log('\n7️⃣ Testing frontend API compatibility...');

    // Test if the API matches what the frontend expects
    console.log('   Testing response structure compatibility...');

    const frontendUsersResult = await makeAuthenticatedRequest('GET', '/api/users?page=1&limit=10');
    if (frontendUsersResult.success) {
        const response = frontendUsersResult.data;
        console.log('✅ Frontend users API structure:');
        console.log(`   - Has success field: ${response.hasOwnProperty('success')}`);
        console.log(`   - Has users array: ${response.hasOwnProperty('users')}`);
        console.log(`   - Has pagination: ${response.hasOwnProperty('pagination')}`);

        if (response.users && response.users.length > 0) {
            const sampleUser = response.users[0];
            console.log(`   - Sample user fields: ${Object.keys(sampleUser).join(', ')}`);
            console.log(`   - User ID field: ${sampleUser._id ? '_id' : sampleUser.id ? 'id' : 'MISSING'}`);
        }
    } else {
        console.error('❌ Frontend users API failed:', frontendUsersResult.error);
    }

    console.log('\n🎯 Test Summary:');
    console.log('==================');
    console.log('✅ Admin authentication: Working');
    console.log('✅ User list fetch: Working');
    console.log(`${singleUserResult.success ? '✅' : '❌'} Single user fetch: ${singleUserResult.success ? 'Working' : 'Failed'}`);
    console.log(`${updateResult.success ? '✅' : '❌'} User update: ${updateResult.success ? 'Working' : 'Failed'}`);
    console.log(`${deleteResult.success ? '✅' : '❌'} User deletion: ${deleteResult.success ? 'Working' : 'Failed'}`);

    if (!updateResult.success || !deleteResult.success) {
        console.log('\n🔧 ISSUE IDENTIFIED:');
        console.log('The user management edit/delete functions are failing at the API level.');
        console.log('This suggests the issue is in the backend API implementation or frontend API calls.');
    } else {
        console.log('\n🎉 All backend API tests passed!');
        console.log('The issue might be in the frontend implementation or user permissions.');
    }
}

// Run the test
testUserManagementFlow().catch(error => {
    console.error('\n💥 Test failed with error:', error.message);
    process.exit(1);
});
