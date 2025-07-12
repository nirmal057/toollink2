const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testUserManagementFiltering() {
    console.log('🔍 TESTING USER MANAGEMENT FILTERING');
    console.log('='.repeat(50));

    try {
        // Step 1: Login as admin
        console.log('\n1. 🔑 ADMIN LOGIN');
        console.log('-'.repeat(30));

        const adminLoginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        if (!adminLoginResponse.data.success) {
            console.log('❌ Admin login failed');
            return;
        }

        const adminToken = adminLoginResponse.data.accessToken;
        console.log('✅ Admin login successful');

        // Step 2: Get current user count
        console.log('\n2. 📊 CHECKING CURRENT USER COUNT');
        console.log('-'.repeat(30));

        const initialUsersResponse = await axios.get(`${API_BASE}/api/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const initialUserCount = initialUsersResponse.data.data.length;
        console.log(`📋 Current users in management: ${initialUserCount}`);

        // Step 3: Register a new customer (should be pending)
        console.log('\n3. 👤 REGISTERING NEW CUSTOMER');
        console.log('-'.repeat(30));

        const customerData = {
            username: `testcustomer${Date.now()}`,
            email: `customer${Date.now()}@test.com`,
            password: 'customer123',
            fullName: 'Test Pending Customer',
            phone: '+94771234567',
            role: 'customer'
        };

        console.log(`📧 Email: ${customerData.email}`);

        const registerResponse = await axios.post(`${API_BASE}/api/auth/register`, customerData);

        if (registerResponse.data.success && registerResponse.data.requiresApproval) {
            console.log('✅ Customer registered with pending approval');
        } else {
            console.log('❌ Customer registration failed or was auto-approved');
            return;
        }

        // Step 4: Check user management again (should be same count)
        console.log('\n4. 🚫 VERIFYING PENDING CUSTOMER NOT IN USER MANAGEMENT');
        console.log('-'.repeat(30));

        const afterRegisterResponse = await axios.get(`${API_BASE}/api/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const afterRegisterCount = afterRegisterResponse.data.data.length;
        console.log(`📋 Users in management after registration: ${afterRegisterCount}`);

        if (afterRegisterCount === initialUserCount) {
            console.log('✅ Pending customer correctly NOT shown in user management');
        } else {
            console.log('❌ Pending customer incorrectly shown in user management');
        }

        // Step 5: Get pending customers
        console.log('\n5. 📋 CHECKING PENDING CUSTOMERS');
        console.log('-'.repeat(30));

        const pendingResponse = await axios.get(`${API_BASE}/api/auth/pending-users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (pendingResponse.data.success) {
            const pendingCustomer = pendingResponse.data.users.find(user => user.email === customerData.email);
            if (pendingCustomer) {
                console.log('✅ Customer found in pending list');
                console.log(`👤 Name: ${pendingCustomer.fullName}`);

                // Step 6: Approve the customer
                console.log('\n6. ✅ APPROVING CUSTOMER');
                console.log('-'.repeat(30));

                const approveResponse = await axios.post(`${API_BASE}/api/auth/approve-user`, {
                    userId: pendingCustomer._id
                }, {
                    headers: { 'Authorization': `Bearer ${adminToken}` }
                });

                if (approveResponse.data.success) {
                    console.log('✅ Customer approved successfully');

                    // Step 7: Check user management again (should increase by 1)
                    console.log('\n7. 🎉 VERIFYING APPROVED CUSTOMER IN USER MANAGEMENT');
                    console.log('-'.repeat(30));

                    // Wait a moment for database update
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    const finalUsersResponse = await axios.get(`${API_BASE}/api/users`, {
                        headers: { 'Authorization': `Bearer ${adminToken}` }
                    });

                    const finalUserCount = finalUsersResponse.data.data.length;
                    console.log(`📋 Users in management after approval: ${finalUserCount}`);

                    if (finalUserCount === initialUserCount + 1) {
                        console.log('✅ Approved customer now correctly shown in user management');

                        // Find the approved customer in the list
                        const approvedCustomer = finalUsersResponse.data.data.find(user => user.email === customerData.email);
                        if (approvedCustomer) {
                            console.log(`👤 Found in user management: ${approvedCustomer.fullName}`);
                            console.log(`🔑 Role: ${approvedCustomer.role}`);
                            console.log(`✓ Status: ${approvedCustomer.isApproved ? 'Approved' : 'Pending'}`);
                        }
                    } else {
                        console.log('❌ Approved customer not found in user management');
                    }
                } else {
                    console.log('❌ Customer approval failed');
                }
            } else {
                console.log('❌ Customer not found in pending list');
            }
        } else {
            console.log('❌ Failed to get pending customers');
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎯 USER MANAGEMENT FILTERING TEST COMPLETED');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        if (error.response) {
            console.error('📋 Response data:', error.response.data);
            console.error('📊 Status:', error.response.status);
        }
    }
}

// Run the test
testUserManagementFiltering();
