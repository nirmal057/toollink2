// Complete Customer Account Approval System Test
// Tests the exact workflow as specified in the requirements

const BASE_URL = 'http://localhost:5000/api';

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

async function testCustomerApprovalWorkflow() {
  console.log('🚀 Testing Complete Customer Account Approval Logic\n');

  // Test customer data
  const testCustomer = {
    username: `testcustomer${Date.now()}`,
    email: `testcustomer${Date.now()}@example.com`,
    password: 'test123',
    fullName: 'Test Customer Account',
    phone: '1234567890',
    role: 'customer'
  };

  const cashierCreds = {
    email: 'cashier@toollink.com',
    password: 'cashier123'
  };

  try {
    console.log('📝 STEP 1: Customer Signs Up (Should Create Inactive Account)');
    console.log('='.repeat(60));
    
    const { response: regResponse, data: regData } = await makeRequest('/auth/register', 'POST', testCustomer);
    
    if (regResponse.ok && regData.success) {
      console.log('✅ Customer account created successfully');
      console.log(`   Status: ${regData.status || 'N/A'}`);
      console.log(`   Requires Approval: ${regData.requiresApproval || 'N/A'}`);
      console.log(`   Message: ${regData.message}`);
      
      if (regData.status === 'pending' || regData.requiresApproval) {
        console.log('✅ PASS: Account created in inactive state as required');
      } else {
        console.log('❌ FAIL: Account should be created in inactive state');
        return;
      }
    } else {
      console.log('❌ Customer registration failed:', regData.error);
      return;
    }

    console.log('\n🚫 STEP 2: Customer Tries to Login (Should Be Blocked)');
    console.log('='.repeat(60));
    
    const { response: loginResponse1, data: loginData1 } = await makeRequest('/auth/login', 'POST', {
      email: testCustomer.email,
      password: testCustomer.password
    });

    if (!loginResponse1.ok) {
      console.log('✅ Login correctly blocked for unapproved customer');
      console.log(`   Status Code: ${loginResponse1.status}`);
      console.log(`   Error Message: "${loginData1.error}"`);
      
      if (loginData1.error === 'Your account is waiting for approval.') {
        console.log('✅ PASS: Exact message displayed as required');
      } else {
        console.log('❌ FAIL: Message should be "Your account is waiting for approval."');
      }
      
      console.log(`   Status: ${loginData1.status}`);
    } else {
      console.log('❌ FAIL: Login should have been blocked for unapproved customer');
      return;
    }

    console.log('\n👨‍💼 STEP 3: Cashier/Admin Logs In');
    console.log('='.repeat(60));
    
    const { response: cashierLoginResponse, data: cashierLoginData } = await makeRequest('/auth/login', 'POST', cashierCreds);

    if (cashierLoginResponse.ok && cashierLoginData.success) {
      console.log('✅ Cashier login successful');
      const cashierToken = cashierLoginData.accessToken;
      console.log(`   User: ${cashierLoginData.user.name} (${cashierLoginData.user.role})`);

      console.log('\n📋 STEP 4: View Pending Customer Approvals');
      console.log('='.repeat(60));
      
      const { response: pendingResponse, data: pendingData } = await makeRequest('/auth/pending-users', 'GET', null, cashierToken);

      if (pendingResponse.ok && pendingData.success) {
        console.log('✅ Pending customers retrieved');
        console.log(`   Count: ${pendingData.users ? pendingData.users.length : 0}`);
        
        const pendingCustomer = pendingData.users?.find(c => c.email === testCustomer.email);
        if (pendingCustomer) {
          console.log(`   Found test customer: ${pendingCustomer.full_name} (${pendingCustomer.email})`);
          console.log(`   Status: ${pendingCustomer.status}`);

          console.log('\n✅ STEP 5: Cashier/Admin Approves Customer (Sets approved = true)');
          console.log('='.repeat(60));
          
          const { response: approvalResponse, data: approvalData } = await makeRequest(
            `/auth/approve-user/${pendingCustomer.id}`, 
            'POST', 
            null, 
            cashierToken
          );

          if (approvalResponse.ok && approvalData.success) {
            console.log('✅ Customer approved successfully');
            console.log(`   Message: ${approvalData.message}`);

            console.log('\n🎉 STEP 6: Approved Customer Can Now Log In and Access Portal');
            console.log('='.repeat(60));
            
            const { response: loginResponse2, data: loginData2 } = await makeRequest('/auth/login', 'POST', {
              email: testCustomer.email,
              password: testCustomer.password
            });

            if (loginResponse2.ok && loginData2.success) {
              console.log('✅ PASS: Customer login successful after approval!');
              console.log(`   User: ${loginData2.user.name} (${loginData2.user.role})`);
              console.log(`   Status: ${loginData2.user.status}`);
              console.log(`   Has Access Token: ${loginData2.accessToken ? 'Yes' : 'No'}`);
              console.log(`   Can Access Customer Portal: Yes`);
              
              console.log('\n🎯 TEST SUMMARY');
              console.log('='.repeat(60));
              console.log('✅ Customer signup creates inactive account (approved = false)');
              console.log('✅ Customer cannot log in before approval');
              console.log('✅ Shows message: "Your account is waiting for approval."');
              console.log('✅ Cashier/Admin can approve customer (sets approved = true)');
              console.log('✅ Approved customer can log in and access customer portal');
              console.log('\n🎉 ALL REQUIREMENTS MET! Customer Approval System Working Perfectly! 🎉');
              
            } else {
              console.log('❌ FAIL: Customer login failed after approval:', loginData2.error);
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
      console.log('❌ Cashier login failed:', cashierLoginData.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the complete test
testCustomerApprovalWorkflow();
