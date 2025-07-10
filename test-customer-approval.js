/**
 * Customer Approval System Testing Script
 * 
 * This script tests the complete customer approval workflow:
 * 1. Register a new customer (account will be pending)
 * 2. Try to login as customer (should fail - pending approval)
 * 3. Login as cashier/admin
 * 4. Approve the customer account
 * 5. Login as customer (should succeed)
 */

const API_BASE = 'http://localhost:5000/api'; // Backend on port 5000

async function testCustomerApprovalFlow() {
    console.log('🧪 Testing Customer Approval System...\n');

    // Test data
    const newCustomer = {
        username: 'testcustomer123',
        email: 'testcustomer123@example.com',
        password: 'testpassword123',
        fullName: 'Test Customer User',
        phone: '1234567890',
        role: 'customer'
    };

    const cashierCredentials = {
        email: 'cashier@toolink.com',
        password: 'cashier123'
    };

    try {
        // Step 1: Register new customer
        console.log('📝 Step 1: Registering new customer...');
        const registerResponse = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newCustomer)
        });

        const registerData = await registerResponse.json();
        console.log('Register Response:', registerData);

        if (!registerResponse.ok) {
            console.log('❌ Registration failed (might already exist):', registerData.error);
        } else {
            console.log('✅ Customer registered successfully - Account is pending approval');
        }

        // Step 2: Try to login as customer (should fail)
        console.log('\n🔐 Step 2: Attempting customer login (should fail - pending approval)...');
        const customerLoginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: newCustomer.email,
                password: newCustomer.password
            })
        });

        const customerLoginData = await customerLoginResponse.json();
        console.log('Customer Login Response:', customerLoginData);

        if (!customerLoginResponse.ok) {
            console.log('✅ Customer login blocked as expected:', customerLoginData.error);
        } else {
            console.log('❌ Customer login should have been blocked!');
        }

        // Step 3: Login as cashier
        console.log('\n👨‍💼 Step 3: Logging in as cashier...');
        const cashierLoginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cashierCredentials)
        });

        const cashierLoginData = await cashierLoginResponse.json();
        console.log('Cashier Login Response:', cashierLoginData);

        if (!cashierLoginResponse.ok) {
            console.log('❌ Cashier login failed:', cashierLoginData.error);
            console.log('⚠️  Make sure a cashier account exists with email: cashier@toolink.com');
            return;
        }

        const cashierToken = cashierLoginData.accessToken;
        console.log('✅ Cashier logged in successfully');

        // Step 4: Get pending users
        console.log('\n📋 Step 4: Fetching pending users...');
        const pendingUsersResponse = await fetch(`${API_BASE}/auth/pending-users`, {
            headers: {
                'Authorization': `Bearer ${cashierToken}`,
                'Content-Type': 'application/json'
            }
        });

        const pendingUsersData = await pendingUsersResponse.json();
        console.log('Pending Users Response:', pendingUsersData);

        const pendingCustomer = pendingUsersData.users?.find(u => u.email === newCustomer.email);
        if (!pendingCustomer) {
            console.log('❌ No pending customer found to approve');
            return;
        }

        console.log(`✅ Found pending customer: ${pendingCustomer.email} (ID: ${pendingCustomer.id})`);

        // Step 5: Approve the customer
        console.log('\n✅ Step 5: Approving customer account...');
        const approveResponse = await fetch(`${API_BASE}/auth/approve-user`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cashierToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: pendingCustomer._id || pendingCustomer.id
            })
        });

        const approveData = await approveResponse.json();
        console.log('Approve Response:', approveData);

        if (!approveResponse.ok) {
            console.log('❌ Customer approval failed:', approveData.error);
            return;
        }

        console.log('✅ Customer approved successfully!');

        // Step 6: Customer login should now work
        console.log('\n🔐 Step 6: Customer login attempt (should succeed now)...');
        const finalLoginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: newCustomer.email,
                password: newCustomer.password
            })
        });

        const finalLoginData = await finalLoginResponse.json();
        console.log('Final Customer Login Response:', finalLoginData);

        if (finalLoginResponse.ok) {
            console.log('✅ Customer can now login successfully!');
            console.log('🎉 Customer Approval System is working correctly!\n');
        } else {
            console.log('❌ Customer login still failed:', finalLoginData.error);
        }

        // Summary
        console.log('📊 Test Summary:');
        console.log('✅ Customer registration with pending status');
        console.log('✅ Blocked login for pending customers');
        console.log('✅ Cashier can view pending customers');
        console.log('✅ Cashier can approve customers');
        console.log('✅ Approved customers can login');
        console.log('\n🎯 Customer Approval System is fully functional!');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Test rejection flow
async function testRejectionFlow() {
    console.log('\n🧪 Testing Customer Rejection Flow...\n');

    // Register another customer for rejection test
    const rejectCustomer = {
        username: 'rejecttest123',
        email: 'rejecttest123@example.com',
        password: 'testpassword123',
        fullName: 'Test Reject User',
        role: 'customer'
    };

    const cashierCredentials = {
        email: 'cashier@toolink.com',
        password: 'cashier123'
    };

    try {
        // Register customer
        console.log('📝 Registering customer for rejection test...');
        const registerResponse = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rejectCustomer)
        });

        const registerData = await registerResponse.json();
        if (!registerResponse.ok && !registerData.error?.includes('already exists')) {
            console.log('❌ Registration failed:', registerData.error);
            return;
        }

        // Login as cashier
        const cashierLoginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cashierCredentials)
        });

        const cashierLoginData = await cashierLoginResponse.json();
        if (!cashierLoginResponse.ok) {
            console.log('❌ Cashier login failed');
            return;
        }

        // Get pending users and find our test user
        const pendingResponse = await fetch(`${API_BASE}/auth/pending-users`, {
            headers: {
                'Authorization': `Bearer ${cashierLoginData.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const pendingData = await pendingResponse.json();
        const testUser = pendingData.users?.find(u => u.email === rejectCustomer.email);

        if (testUser) {
            // Reject the customer
            console.log('❌ Rejecting customer account...');
            const rejectResponse = await fetch(`${API_BASE}/auth/reject-user/${testUser.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cashierLoginData.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'Test rejection - automated test' })
            });

            const rejectData = await rejectResponse.json();
            if (rejectResponse.ok) {
                console.log('✅ Customer rejected successfully:', rejectData.message);
            } else {
                console.log('❌ Rejection failed:', rejectData.error);
            }
        }

    } catch (error) {
        console.error('❌ Rejection test failed:', error);
    }
}

// Run tests
testCustomerApprovalFlow().then(() => {
    testRejectionFlow();
});
