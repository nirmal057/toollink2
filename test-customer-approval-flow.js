// Test script for customer approval flow
const BASE_URL = 'http://localhost:5000/api';

// Test customer data
const testCustomer = {
  username: `testcustomer${Date.now()}`,
  email: `testcustomer${Date.now()}@example.com`, 
  password: 'test123',
  fullName: 'Test Customer',
  phone: '1234567890',
  role: 'customer'
};

// Admin credentials for approval
const adminCreds = {
  email: 'admin@toollink.com',
  password: 'admin123'
};

async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  
  return { response, data };
}

async function testCustomerApprovalFlow() {
  console.log('🚀 Starting Customer Approval Flow Test...\n');

  try {
    // Step 1: Register new customer
    console.log('1️⃣  Registering new customer...');
    const { response: regResponse, data: regData } = await makeRequest('/auth/register', 'POST', testCustomer);
    
    if (regResponse.ok && regData.success) {
      console.log('✅ Customer registered successfully');
      console.log(`   Status: ${regData.status || 'N/A'}`);
      console.log(`   Message: ${regData.message}`);
      console.log(`   Requires Approval: ${regData.requiresApproval || 'N/A'}\n`);
    } else {
      console.log('❌ Customer registration failed:', regData.error);
      return;
    }

    // Step 2: Try to login with pending customer (should fail)
    console.log('2️⃣  Trying to login with pending customer...');
    const { response: loginResponse1, data: loginData1 } = await makeRequest('/auth/login', 'POST', {
      email: testCustomer.email,
      password: testCustomer.password
    });

    if (!loginResponse1.ok) {
      console.log('✅ Login correctly blocked for pending customer');
      console.log(`   Status Code: ${loginResponse1.status}`);
      console.log(`   Error: ${loginData1.error}`);
      console.log(`   Status: ${loginData1.status}\n`);
    } else {
      console.log('❌ Login should have been blocked for pending customer\n');
      return;
    }

    // Step 3: Login as admin
    console.log('3️⃣  Logging in as admin...');
    const { response: adminLoginResponse, data: adminLoginData } = await makeRequest('/auth/login', 'POST', adminCreds);

    if (adminLoginResponse.ok && adminLoginData.success) {
      console.log('✅ Admin login successful');
      const adminToken = adminLoginData.accessToken;
      console.log(`   Token: ${adminToken.substring(0, 20)}...\n`);      // Step 4: Get pending customers
      console.log('4️⃣  Getting pending customers...');
      const { response: pendingResponse, data: pendingData } = await makeRequest('/auth/pending-users', 'GET', null, adminToken);

      if (pendingResponse.ok && pendingData.success) {
        console.log('✅ Pending customers retrieved');
        console.log(`   Count: ${pendingData.users ? pendingData.users.length : 0}`);
        
        const pendingCustomer = pendingData.users?.find(c => c.email === testCustomer.email);
        if (pendingCustomer) {
          console.log(`   Found our test customer: ${pendingCustomer.full_name} (${pendingCustomer.email})\n`);

          // Step 5: Approve the customer
          console.log('5️⃣  Approving customer...');
          const { response: approvalResponse, data: approvalData } = await makeRequest(
            `/auth/approve-user/${pendingCustomer.id}`, 
            'POST', 
            null, 
            adminToken
          );

          if (approvalResponse.ok && approvalData.success) {
            console.log('✅ Customer approved successfully');
            console.log(`   Message: ${approvalData.message}\n`);

            // Step 6: Try to login again (should succeed)
            console.log('6️⃣  Trying to login with approved customer...');
            const { response: loginResponse2, data: loginData2 } = await makeRequest('/auth/login', 'POST', {
              email: testCustomer.email,
              password: testCustomer.password
            });

            if (loginResponse2.ok && loginData2.success) {
              console.log('✅ Customer login successful after approval!');
              console.log(`   User: ${loginData2.user.name} (${loginData2.user.role})`);
              console.log(`   Status: ${loginData2.user.status}`);
              console.log(`   Token: ${loginData2.accessToken.substring(0, 20)}...\n`);
              
              console.log('🎉 Customer Approval Flow Test PASSED! 🎉');
            } else {
              console.log('❌ Customer login failed after approval:', loginData2.error);
            }
          } else {
            console.log('❌ Customer approval failed:', approvalData.error);
          }
        } else {
          console.log('❌ Test customer not found in pending list');
        }
      } else {
        console.log('❌ Failed to get pending customers:', pendingData.error);
      }
    } else {
      console.log('❌ Admin login failed:', adminLoginData.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testCustomerApprovalFlow();
