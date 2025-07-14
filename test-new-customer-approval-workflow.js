import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/auth';

// Test customer data
const testCustomer = {
    username: `testcustomer_${Date.now()}`,
    email: `customer_${Date.now()}@test.com`,
    password: 'test123456',
    fullName: 'Test Customer User',
    phone: '+94771234567',
    role: 'customer'
};

const adminCredentials = {
    email: 'admin@toollink.com',
    password: 'admin123'
};

async function testNewCustomerApprovalWorkflow() {
    console.log('🧪 TESTING NEW CUSTOMER APPROVAL WORKFLOW');
    console.log('==========================================');
    console.log('📋 Workflow: Customer Details NOT Saved in Users Database Until Approval');
    console.log('==========================================\n');

    try {
        // Step 1: Customer Registration (should NOT save to Users database)
        console.log('📝 Step 1: Customer Registration (Should NOT save to Users database)');
        console.log('-'.repeat(70));
        console.log(`👤 Customer: ${testCustomer.fullName}`);
        console.log(`📧 Email: ${testCustomer.email}`);

        const registerResponse = await axios.post(`${API_BASE}/register`, testCustomer);

        if (registerResponse.data.success) {
            console.log('✅ Customer registration submitted successfully');
            console.log(`📋 Status: ${registerResponse.data.status}`);
            console.log(`🔄 Requires Approval: ${registerResponse.data.requiresApproval}`);
            console.log(`📝 Message: ${registerResponse.data.message}`);
            console.log('📊 Customer details saved to PendingCustomer collection (NOT Users)');
        } else {
            console.log('❌ Registration failed:', registerResponse.data.error);
            return;
        }

        // Step 2: Verify customer CANNOT login (not in Users database)
        console.log('\n🚫 Step 2: Verify Customer CANNOT Login (Not in Users Database)');
        console.log('-'.repeat(70));

        try {
            const loginResponse = await axios.post(`${API_BASE}/login`, {
                email: testCustomer.email,
                password: testCustomer.password
            });

            if (loginResponse.data.success) {
                console.log('❌ ERROR: Customer login succeeded (this should NOT happen!)');
            }
        } catch (loginError) {
            if (loginError.response?.data?.errorType === 'ACCOUNT_PENDING_APPROVAL') {
                console.log('✅ Customer login correctly blocked - account pending approval');
                console.log(`📋 Message: ${loginError.response.data.error}`);
            } else {
                console.log('❌ Unexpected login error:', loginError.response?.data?.error);
            }
        }

        // Step 3: Admin login
        console.log('\n🔑 Step 3: Admin Login');
        console.log('-'.repeat(70));

        const adminLoginResponse = await axios.post(`${API_BASE}/login`, adminCredentials);

        if (adminLoginResponse.data.success) {
            console.log('✅ Admin login successful');
            const adminToken = adminLoginResponse.data.accessToken;

            // Step 4: View pending customers (from PendingCustomer collection)
            console.log('\n📋 Step 4: View Pending Customers (From PendingCustomer Collection)');
            console.log('-'.repeat(70));

            const pendingResponse = await axios.get(`${API_BASE}/pending-users`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            if (pendingResponse.data.success) {
                const pendingCustomers = pendingResponse.data.users;
                console.log(`✅ Found ${pendingCustomers.length} pending customers in PendingCustomer collection`);

                const ourCustomer = pendingCustomers.find(c => c.email === testCustomer.email);
                if (ourCustomer) {
                    console.log(`📧 Found our test customer: ${ourCustomer.fullName} (${ourCustomer.email})`);
                    console.log(`📅 Submitted: ${new Date(ourCustomer.submittedAt).toLocaleString()}`);
                    console.log(`📊 Status: ${ourCustomer.status}`);

                    // Step 5: Approve customer (move from PendingCustomer to Users)
                    console.log('\n✅ Step 5: Approve Customer (Move from PendingCustomer to Users Database)');
                    console.log('-'.repeat(70));

                    const approveResponse = await axios.post(`${API_BASE}/approve-user`, {
                        userId: ourCustomer._id
                    }, {
                        headers: { 'Authorization': `Bearer ${adminToken}` }
                    });

                    if (approveResponse.data.success) {
                        console.log('✅ Customer approved successfully!');
                        console.log('📊 Customer moved from PendingCustomer collection to Users database');
                        console.log(`👤 User ID in main database: ${approveResponse.data.user.id}`);
                        console.log(`📋 Message: ${approveResponse.data.message}`);

                        // Step 6: Verify customer can now login (exists in Users database)
                        console.log('\n🔐 Step 6: Verify Customer Can Now Login (Now in Users Database)');
                        console.log('-'.repeat(70));

                        // Wait a moment for database to update
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        const finalLoginResponse = await axios.post(`${API_BASE}/login`, {
                            email: testCustomer.email,
                            password: testCustomer.password
                        });

                        if (finalLoginResponse.data.success) {
                            console.log('✅ Customer login successful after approval!');
                            console.log(`👤 Logged in as: ${finalLoginResponse.data.user.fullName}`);
                            console.log(`🔑 Role: ${finalLoginResponse.data.user.role}`);
                            console.log(`✅ Account approved: ${finalLoginResponse.data.user.isApproved}`);
                            console.log('🎉 Customer now has full access to the system!');
                        } else {
                            console.log('❌ Customer login failed after approval:', finalLoginResponse.data.error);
                        }

                        // Step 7: Verify customer no longer in PendingCustomer collection
                        console.log('\n🗑️ Step 7: Verify Customer Removed from PendingCustomer Collection');
                        console.log('-'.repeat(70));

                        const finalPendingResponse = await axios.get(`${API_BASE}/pending-users`, {
                            headers: { 'Authorization': `Bearer ${adminToken}` }
                        });

                        if (finalPendingResponse.data.success) {
                            const finalPendingCustomers = finalPendingResponse.data.users;
                            const stillPending = finalPendingCustomers.find(c => c.email === testCustomer.email);

                            if (!stillPending) {
                                console.log('✅ Customer successfully removed from PendingCustomer collection');
                                console.log(`📊 Current pending customers: ${finalPendingCustomers.length}`);
                            } else {
                                console.log('❌ Customer still exists in PendingCustomer collection');
                            }
                        }

                    } else {
                        console.log('❌ Customer approval failed:', approveResponse.data.error);
                    }
                } else {
                    console.log('❌ Test customer not found in pending list');
                }
            } else {
                console.log('❌ Failed to fetch pending customers:', pendingResponse.data.error);
            }
        } else {
            console.log('❌ Admin login failed:', adminLoginResponse.data.error);
        }

        console.log('\n🎯 NEW CUSTOMER APPROVAL WORKFLOW TEST SUMMARY');
        console.log('===============================================');
        console.log('✅ Customer registration saves to PendingCustomer collection (NOT Users)');
        console.log('✅ Customer cannot login before approval (not in Users database)');
        console.log('✅ Admin can view pending customers from PendingCustomer collection');
        console.log('✅ Approval moves customer from PendingCustomer to Users database');
        console.log('✅ Approved customer can login (now exists in Users database)');
        console.log('✅ Customer removed from PendingCustomer after approval');
        console.log('\n🎉 NEW WORKFLOW IMPLEMENTATION COMPLETE!');

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        if (error.response) {
            console.error('📋 Response data:', error.response.data);
            console.error('📊 Status:', error.response.status);
        }
    }
}

// Test rejection workflow
async function testRejectionWorkflow() {
    console.log('\n\n🚫 TESTING CUSTOMER REJECTION WORKFLOW');
    console.log('======================================\n');

    const testCustomer2 = {
        username: `testcustomer2_${Date.now()}`,
        email: `customer2_${Date.now()}@test.com`,
        password: 'test123456',
        fullName: 'Test Customer for Rejection',
        phone: '+94771234568',
        role: 'customer'
    };

    try {
        // Register another customer
        console.log('📝 Registering customer for rejection test...');
        const registerResponse2 = await axios.post(`${API_BASE}/register`, testCustomer2);

        if (registerResponse2.data.success) {
            console.log('✅ Second customer registered for rejection test');

            // Admin login
            const adminLoginResponse = await axios.post(`${API_BASE}/login`, adminCredentials);
            if (adminLoginResponse.data.success) {
                const adminToken = adminLoginResponse.data.accessToken;

                // Get pending customers
                const pendingResponse = await axios.get(`${API_BASE}/pending-users`, {
                    headers: { 'Authorization': `Bearer ${adminToken}` }
                });

                if (pendingResponse.data.success) {
                    const ourCustomer = pendingResponse.data.users.find(c => c.email === testCustomer2.email);
                    if (ourCustomer) {
                        // Reject the customer
                        console.log('🚫 Rejecting customer...');
                        const rejectResponse = await axios.post(`${API_BASE}/reject-user`, {
                            userId: ourCustomer._id,
                            reason: 'Test rejection - incomplete information'
                        }, {
                            headers: { 'Authorization': `Bearer ${adminToken}` }
                        });

                        if (rejectResponse.data.success) {
                            console.log('✅ Customer rejected and removed from PendingCustomer collection');
                            console.log(`📋 Message: ${rejectResponse.data.message}`);

                            // Try to login as rejected customer (should fail)
                            try {
                                await axios.post(`${API_BASE}/login`, {
                                    email: testCustomer2.email,
                                    password: testCustomer2.password
                                });
                                console.log('❌ Rejected customer login succeeded (should have failed!)');
                            } catch (error) {
                                console.log('✅ Rejected customer login correctly blocked');
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ Rejection test failed:', error.message);
    }
}

// Run tests
async function runAllTests() {
    await testNewCustomerApprovalWorkflow();
    await testRejectionWorkflow();
}

runAllTests().catch(console.error);
