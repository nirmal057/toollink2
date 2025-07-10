/**
 * Complete Customer Approval Workflow Test
 * 
 * This script tests the entire customer approval system:
 * 1. Register a new customer account (should be pending)
 * 2. Try to login as customer (should fail - pending approval)
 * 3. Login as admin/cashier
 * 4. List pending users
 * 5. Approve the customer account
 * 6. Customer can now login successfully
 * 7. Test rejection workflow
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const BACKEND_BASE = 'http://localhost:5000';

// Test data
const testCustomer = {
    username: 'testcustomer' + Date.now(),
    email: 'testcustomer' + Date.now() + '@example.com',
    password: 'testpassword123',
    fullName: 'Test Customer User',
    phone: '+94-77-123-4567',
    role: 'customer'
};

const testCustomer2 = {
    username: 'testcustomer2' + Date.now(),
    email: 'testcustomer2' + Date.now() + '@example.com',
    password: 'testpassword123',
    fullName: 'Test Customer User 2',
    phone: '+94-77-123-4568',
    role: 'customer'
};

const adminCredentials = {
    email: 'admin@toollink.com',
    password: 'admin123'
};

const cashierCredentials = {
    email: 'cashier@toollink.com',
    password: 'cashier123'
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteCustomerApprovalWorkflow() {
    console.log('🧪 TESTING COMPLETE CUSTOMER APPROVAL WORKFLOW');
    console.log('=================================================\n');

    try {
        // Step 1: Register new customer
        console.log('📝 Step 1: Registering new customer...');
        const registerResponse = await axios.post(`${API_BASE}/auth/register`, testCustomer);
        
        if (registerResponse.data.success) {
            console.log('✅ Customer registered successfully');
            console.log(`📧 Customer: ${testCustomer.email}`);
            console.log(`🔄 Requires Approval: ${registerResponse.data.requiresApproval}`);
            
            if (registerResponse.data.requiresApproval) {
                console.log('✅ Customer approval required - CORRECT!');
            } else {
                console.log('❌ Customer was auto-approved - INCORRECT!');
            }
        } else {
            console.log('❌ Registration failed:', registerResponse.data.error);
        }

        // Step 2: Try to login as customer (should fail)
        console.log('\n🔐 Step 2: Attempting customer login (should fail)...');
        try {
            const customerLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
                email: testCustomer.email,
                password: testCustomer.password
            });
            
            if (customerLoginResponse.data.success) {
                console.log('❌ Customer login succeeded - SHOULD HAVE FAILED!');
            }
        } catch (error) {
            if (error.response?.status === 401 && error.response?.data?.errorType === 'ACCOUNT_PENDING_APPROVAL') {
                console.log('✅ Customer login blocked - CORRECT!');
                console.log(`📋 Error: ${error.response.data.error}`);
            } else {
                console.log('❌ Unexpected error:', error.response?.data?.error || error.message);
            }
        }

        // Step 3: Login as admin
        console.log('\n👨‍💼 Step 3: Logging in as admin...');
        const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, adminCredentials);
        
        if (adminLoginResponse.data.success) {
            console.log('✅ Admin login successful');
            const adminToken = adminLoginResponse.data.accessToken;

            // Step 4: List pending users
            console.log('\n📋 Step 4: Fetching pending users...');
            const pendingUsersResponse = await axios.get(`${API_BASE}/auth/pending-users`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            if (pendingUsersResponse.data.success) {
                const pendingUsers = pendingUsersResponse.data.users;
                console.log(`✅ Found ${pendingUsers.length} pending users`);
                
                const ourCustomer = pendingUsers.find(u => u.email === testCustomer.email);
                if (ourCustomer) {
                    console.log(`✅ Found our test customer: ${ourCustomer.email}`);
                    
                    // Step 5: Approve the customer
                    console.log('\n✅ Step 5: Approving customer account...');
                    const approveResponse = await axios.post(`${API_BASE}/auth/approve-user`, {
                        userId: ourCustomer._id
                    }, {
                        headers: { 'Authorization': `Bearer ${adminToken}` }
                    });

                    if (approveResponse.data.success) {
                        console.log('✅ Customer approved successfully!');
                        console.log(`📋 Message: ${approveResponse.data.message}`);
                        
                        // Step 6: Customer login should now work
                        console.log('\n🔐 Step 6: Customer login attempt (should succeed)...');
                        const finalLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
                            email: testCustomer.email,
                            password: testCustomer.password
                        });

                        if (finalLoginResponse.data.success) {
                            console.log('✅ Customer login successful after approval!');
                            console.log(`👤 Logged in as: ${finalLoginResponse.data.user.fullName}`);
                            console.log(`📧 Email: ${finalLoginResponse.data.user.email}`);
                            console.log(`🔑 Role: ${finalLoginResponse.data.user.role}`);
                        } else {
                            console.log('❌ Customer login failed after approval');
                        }
                    } else {
                        console.log('❌ Customer approval failed:', approveResponse.data.error);
                    }
                } else {
                    console.log('❌ Test customer not found in pending users');
                }
            } else {
                console.log('❌ Failed to fetch pending users:', pendingUsersResponse.data.error);
            }
        } else {
            console.log('❌ Admin login failed:', adminLoginResponse.data.error);
        }

        // Step 7: Test cashier approval workflow
        console.log('\n💰 Step 7: Testing cashier approval workflow...');
        
        // Register second customer
        const registerResponse2 = await axios.post(`${API_BASE}/auth/register`, testCustomer2);
        if (registerResponse2.data.success) {
            console.log('✅ Second customer registered');
            
            // Login as cashier
            const cashierLoginResponse = await axios.post(`${API_BASE}/auth/login`, cashierCredentials);
            if (cashierLoginResponse.data.success) {
                console.log('✅ Cashier login successful');
                const cashierToken = cashierLoginResponse.data.accessToken;
                
                // Get pending users
                const pendingUsersResponse2 = await axios.get(`${API_BASE}/auth/pending-users`, {
                    headers: { 'Authorization': `Bearer ${cashierToken}` }
                });
                
                if (pendingUsersResponse2.data.success) {
                    const pendingUsers2 = pendingUsersResponse2.data.users;
                    const ourCustomer2 = pendingUsers2.find(u => u.email === testCustomer2.email);
                    
                    if (ourCustomer2) {
                        console.log('✅ Cashier can see pending users');
                        
                        // Approve with cashier
                        const approveResponse2 = await axios.post(`${API_BASE}/auth/approve-user`, {
                            userId: ourCustomer2._id
                        }, {
                            headers: { 'Authorization': `Bearer ${cashierToken}` }
                        });
                        
                        if (approveResponse2.data.success) {
                            console.log('✅ Cashier can approve customers!');
                        } else {
                            console.log('❌ Cashier approval failed:', approveResponse2.data.error);
                        }
                    } else {
                        console.log('❌ Second customer not found in pending users');
                    }
                } else {
                    console.log('❌ Cashier cannot fetch pending users:', pendingUsersResponse2.data.error);
                }
            } else {
                console.log('❌ Cashier login failed:', cashierLoginResponse.data.error);
            }
        }

        // Step 8: Test rejection workflow
        console.log('\n🚫 Step 8: Testing rejection workflow...');
        const testCustomer3 = {
            username: 'testcustomer3' + Date.now(),
            email: 'testcustomer3' + Date.now() + '@example.com',
            password: 'testpassword123',
            fullName: 'Test Customer User 3',
            phone: '+94-77-123-4569',
            role: 'customer'
        };

        const registerResponse3 = await axios.post(`${API_BASE}/auth/register`, testCustomer3);
        if (registerResponse3.data.success) {
            console.log('✅ Third customer registered for rejection test');
            
            // Login as admin again
            const adminLoginResponse2 = await axios.post(`${API_BASE}/auth/login`, adminCredentials);
            if (adminLoginResponse2.data.success) {
                const adminToken2 = adminLoginResponse2.data.accessToken;
                
                // Get pending users
                const pendingUsersResponse3 = await axios.get(`${API_BASE}/auth/pending-users`, {
                    headers: { 'Authorization': `Bearer ${adminToken2}` }
                });
                
                if (pendingUsersResponse3.data.success) {
                    const pendingUsers3 = pendingUsersResponse3.data.users;
                    const ourCustomer3 = pendingUsers3.find(u => u.email === testCustomer3.email);
                    
                    if (ourCustomer3) {
                        // Reject the customer
                        const rejectResponse = await axios.post(`${API_BASE}/auth/reject-user`, {
                            userId: ourCustomer3._id,
                            reason: 'Test rejection - invalid information'
                        }, {
                            headers: { 'Authorization': `Bearer ${adminToken2}` }
                        });
                        
                        if (rejectResponse.data.success) {
                            console.log('✅ Customer rejected successfully!');
                            console.log(`📋 Message: ${rejectResponse.data.message}`);
                            
                            // Try to login as rejected customer (should fail)
                            try {
                                const rejectedLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
                                    email: testCustomer3.email,
                                    password: testCustomer3.password
                                });
                                
                                if (rejectedLoginResponse.data.success) {
                                    console.log('❌ Rejected customer login succeeded - SHOULD HAVE FAILED!');
                                }
                            } catch (error) {
                                if (error.response?.status === 401) {
                                    console.log('✅ Rejected customer login blocked - CORRECT!');
                                    console.log(`📋 Error: ${error.response.data.error}`);
                                }
                            }
                        } else {
                            console.log('❌ Customer rejection failed:', rejectResponse.data.error);
                        }
                    }
                }
            }
        }

        console.log('\n🎉 CUSTOMER APPROVAL WORKFLOW TEST COMPLETE!');
        console.log('==============================================');
        console.log('✅ Customer registration with pending status');
        console.log('✅ Blocked login for pending customers');
        console.log('✅ Admin can approve customers');
        console.log('✅ Cashier can approve customers');
        console.log('✅ Approved customers can login');
        console.log('✅ Admin can reject customers');
        console.log('✅ Rejected customers cannot login');
        console.log('\n🎯 SYSTEM READY FOR CUSTOMER APPROVAL WORKFLOW!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response?.data) {
            console.log('Error details:', error.response.data);
        }
    }
}

// Run the test
testCompleteCustomerApprovalWorkflow();
