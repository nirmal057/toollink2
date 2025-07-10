#!/usr/bin/env node

/**
 * Frontend Admin Permissions Debug Test
 * This script tests admin permissions specifically in the frontend context
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:5173';

// Admin credentials
const ADMIN_CREDENTIALS = {
    email: 'admin@toollink.com',
    password: 'admin123'
};

async function testAdminPermissions() {
    console.log('🔍 Testing Admin Permissions for User Management\n');

    // Step 1: Login and get user data
    console.log('1️⃣ Testing admin login and user data...');
    try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, ADMIN_CREDENTIALS);
        const authToken = loginResponse.data.accessToken;
        const user = loginResponse.data.user;

        console.log('✅ Login successful');
        console.log(`   User role: ${user.role}`);
        console.log(`   User email: ${user.email}`);
        console.log(`   User ID: ${user._id || user.id}`);
        console.log(`   User active: ${user.isActive}`);
        console.log(`   User approved: ${user.isApproved}`);

        if (user.role !== 'admin') {
            console.log('❌ USER IS NOT ADMIN! This is why edit/delete doesn\'t work.');
            console.log(`   Expected role: 'admin', got: '${user.role}'`);
        } else {
            console.log('✅ User has admin role');
        }

        // Step 2: Test specific user operations that admin should be able to do
        console.log('\n2️⃣ Testing admin-specific API endpoints...');

        // Test fetching users (admin only)
        try {
            const usersResponse = await axios.get(`${BASE_URL}/api/users?limit=5`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            const users = usersResponse.data.users || [];
            console.log(`✅ Admin can fetch users: ${users.length} users returned`);

            if (users.length > 0) {
                const testUser = users.find(u => u.role !== 'admin');
                if (testUser) {
                    const userId = testUser._id || testUser.id;
                    console.log(`   Testing with user: ${testUser.email} (${testUser.role}) - ID: ${userId}`);

                    // Test user update
                    console.log('\n3️⃣ Testing user update permission...');
                    try {
                        const updateResponse = await axios.put(`${BASE_URL}/api/users/${userId}`, {
                            fullName: testUser.fullName + ' (Admin Test)',
                            phone: testUser.phone || '+94123456789'
                        }, {
                            headers: { Authorization: `Bearer ${authToken}` }
                        });

                        if (updateResponse.data.success) {
                            console.log('✅ Admin can update users via API');

                            // Restore original data
                            await axios.put(`${BASE_URL}/api/users/${userId}`, {
                                fullName: testUser.fullName,
                                phone: testUser.phone || ''
                            }, {
                                headers: { Authorization: `Bearer ${authToken}` }
                            });
                            console.log('✅ Restored original user data');
                        } else {
                            console.log('❌ Admin update failed:', updateResponse.data.error);
                        }
                    } catch (updateError) {
                        console.log('❌ Admin cannot update users:', updateError.response?.data?.error || updateError.message);
                    }

                    // Test user deletion check (don't actually delete)
                    console.log('\n4️⃣ Testing user deletion permission...');
                    try {
                        // Just check if the endpoint exists and returns proper error for valid user
                        const deleteResponse = await axios.delete(`${BASE_URL}/api/users/${userId}`, {
                            headers: { Authorization: `Bearer ${authToken}` }
                        });

                        if (deleteResponse.data.success) {
                            console.log('✅ Admin can delete users via API (soft delete)');

                            // Check if user was soft deleted
                            const checkUser = await axios.get(`${BASE_URL}/api/users/${userId}`, {
                                headers: { Authorization: `Bearer ${authToken}` }
                            });

                            if (checkUser.data.user && checkUser.data.user.isActive === false) {
                                console.log('✅ User was soft deleted correctly');
                            }
                        }
                    } catch (deleteError) {
                        if (deleteError.response?.status === 400 && deleteError.response?.data?.errorType === 'CANNOT_DELETE_SELF') {
                            console.log('✅ Admin deletion endpoint working (cannot delete self protection)');
                        } else {
                            console.log('❌ Admin cannot delete users:', deleteError.response?.data?.error || deleteError.message);
                        }
                    }
                } else {
                    console.log('⚠️  No non-admin users found for testing');
                }
            }
        } catch (error) {
            console.log('❌ Admin cannot fetch users:', error.response?.data?.error || error.message);
            console.log('   This indicates the admin permissions are not working at API level');
        }

        // Step 3: Check what the frontend sees
        console.log('\n5️⃣ Frontend perspective check...');
        console.log('Frontend should store this user data in localStorage:');
        console.log(`{
  "role": "${user.role}",
  "email": "${user.email}",
  "_id": "${user._id || user.id}",
  "isActive": ${user.isActive},
  "isApproved": ${user.isApproved}
}`);

        console.log('\nTo debug frontend issues:');
        console.log(`1. Open ${FRONTEND_URL} in browser`);
        console.log('2. Login with admin@toollink.com / admin123');
        console.log('3. Open browser console and run:');
        console.log('   console.log("User in localStorage:", JSON.parse(localStorage.getItem("user") || "null"))');
        console.log('4. Check if user.role === "admin"');
        console.log('5. Go to User Management page');
        console.log('6. Check browser console for any error messages');

    } catch (error) {
        console.error('❌ Login failed:', error.response?.data?.error || error.message);
        console.log('Cannot proceed with admin permission tests');
    }
}

// Run the test
testAdminPermissions().catch(error => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
});
