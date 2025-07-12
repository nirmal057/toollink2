const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testCustomerRegistrationWorkflow() {
    console.log('🏗️ TESTING CUSTOMER REGISTRATION WITH APPROVAL WORKFLOW');
    console.log('='.repeat(60));

    try {
        // Step 1: Register a new customer
        console.log('\n1. 👤 REGISTERING NEW CUSTOMER');
        console.log('-'.repeat(40));

        const customerData = {
            username: `testcustomer${Date.now()}`,
            email: `customer${Date.now()}@test.com`,
            password: 'customer123',
            fullName: 'Test Customer',
            phone: '+94771234567',
            role: 'customer'
        };

        console.log(`📧 Email: ${customerData.email}`);
        console.log(`👤 Name: ${customerData.fullName}`);

        const registerResponse = await axios.post(`${API_BASE}/api/auth/register`, customerData);

        if (registerResponse.data.success) {
            console.log('✅ Customer registered successfully');
            console.log(`🔓 Requires Approval: ${registerResponse.data.requiresApproval}`);
            console.log(`✓ Status: ${registerResponse.data.user.isApproved ? 'Approved' : 'Pending Approval'}`);
        } else {
            console.log('❌ Customer registration failed:', registerResponse.data.error);
            return;
        }

        // Step 2: Test customer login (should fail)
        console.log('\n2. 🚫 TESTING CUSTOMER LOGIN (SHOULD FAIL)');
        console.log('-'.repeat(40));

        try {
            const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
                email: customerData.email,
                password: customerData.password
            });

            if (loginResponse.data.success) {
                console.log('❌ Customer login succeeded (this should not happen!)');
            }
        } catch (loginError) {
            if (loginError.response && loginError.response.data.errorType === 'ACCOUNT_PENDING_APPROVAL') {
                console.log('✅ Customer login correctly blocked - pending approval');
                console.log(`📋 Message: ${loginError.response.data.error}`);
            } else {
                console.log('❌ Unexpected login error:', loginError.response?.data?.error || loginError.message);
            }
        }

        // Step 3: Login as admin
        console.log('\n3. 🔑 ADMIN LOGIN');
        console.log('-'.repeat(40));

        const adminLoginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        if (adminLoginResponse.data.success) {
            console.log('✅ Admin login successful');
            const adminToken = adminLoginResponse.data.accessToken;

            // Step 4: Get pending customers
            console.log('\n4. 📋 GETTING PENDING CUSTOMERS');
            console.log('-'.repeat(40));

            const pendingResponse = await axios.get(`${API_BASE}/api/auth/pending-users`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            if (pendingResponse.data.success) {
                console.log(`✅ Found ${pendingResponse.data.users.length} pending customers`);

                const pendingCustomer = pendingResponse.data.users.find(user => user.email === customerData.email);

                if (pendingCustomer) {
                    console.log(`📧 Found our test customer: ${pendingCustomer.email}`);

                    // Step 5: Approve the customer
                    console.log('\n5. ✅ APPROVING CUSTOMER');
                    console.log('-'.repeat(40));

                    const approveResponse = await axios.post(`${API_BASE}/api/auth/approve-user`, {
                        userId: pendingCustomer._id
                    }, {
                        headers: { 'Authorization': `Bearer ${adminToken}` }
                    });

                    if (approveResponse.data.success) {
                        console.log('✅ Customer approved successfully');
                        console.log(`👤 Approved: ${approveResponse.data.user.fullName}`);

                        // Step 6: Test customer login again (should succeed)
                        console.log('\n6. 🎉 TESTING CUSTOMER LOGIN (SHOULD SUCCEED)');
                        console.log('-'.repeat(40));

                        // Wait a moment for database to update
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        const finalLoginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
                            email: customerData.email,
                            password: customerData.password
                        });

                        if (finalLoginResponse.data.success) {
                            console.log('✅ Customer login successful after approval!');
                            console.log(`👤 Customer: ${finalLoginResponse.data.user.fullName}`);
                            console.log(`🔑 Role: ${finalLoginResponse.data.user.role}`);
                            console.log('🎉 Customer can now access customer portal!');
                        } else {
                            console.log('❌ Customer login failed after approval:', finalLoginResponse.data.error);
                        }
                    } else {
                        console.log('❌ Customer approval failed:', approveResponse.data.error);
                    }
                } else {
                    console.log('❌ Could not find our test customer in pending list');
                }
            } else {
                console.log('❌ Failed to get pending customers:', pendingResponse.data.error);
            }
        } else {
            console.log('❌ Admin login failed:', adminLoginResponse.data.error);
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎯 CUSTOMER REGISTRATION WORKFLOW TEST COMPLETED');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        if (error.response) {
            console.error('📋 Response data:', error.response.data);
            console.error('📊 Status:', error.response.status);
        }
    }
}

// Run the test
testCustomerRegistrationWorkflow();
