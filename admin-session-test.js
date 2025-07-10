#!/usr/bin/env node

/**
 * Admin Session Persistence Test
 * Tests the admin login, navigation, and session persistence flow
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:5173';

async function testAdminSession() {
  console.log('🧪 Testing Admin Session Persistence\n');

  try {
    // 1. Check if backend is healthy
    console.log('1. Checking backend health...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log(`✅ Backend healthy: ${healthResponse.data.status}`);

    // 2. Test admin login
    console.log('\n2. Testing admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@toolink.com',
      password: 'admin123'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      console.log(`   User: ${loginResponse.data.user.email}`);
      console.log(`   Role: ${loginResponse.data.user.role}`);
      console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);

      const token = loginResponse.data.token;
      const userId = loginResponse.data.user._id;

      // 3. Test token validation
      console.log('\n3. Testing token validation...');
      const validateResponse = await axios.get(`${BASE_URL}/api/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (validateResponse.data.valid) {
        console.log('✅ Token validation successful');
        console.log(`   User ID: ${validateResponse.data.user._id}`);
        console.log(`   Role: ${validateResponse.data.user.role}`);
      } else {
        console.log('❌ Token validation failed');
      }

      // 4. Test admin route access
      console.log('\n4. Testing admin route access...');
      const adminResponse = await axios.get(`${BASE_URL}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (adminResponse.data.success) {
        console.log('✅ Admin dashboard access successful');
        console.log(`   Stats: ${JSON.stringify(adminResponse.data.stats)}`);
      } else {
        console.log('❌ Admin dashboard access failed');
      }

      // 5. Test user profile refresh
      console.log('\n5. Testing user profile refresh...');
      const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.data.user) {
        console.log('✅ Profile refresh successful');
        console.log(`   Email: ${profileResponse.data.user.email}`);
        console.log(`   Role: ${profileResponse.data.user.role}`);
        console.log(`   Status: ${profileResponse.data.user.status}`);
      } else {
        console.log('❌ Profile refresh failed');
      }

    } else {
      console.log('❌ Admin login failed');
      console.log(`   Error: ${loginResponse.data.error}`);
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
  }

  console.log('\n🏁 Test completed');
}

// Frontend test instructions
function printFrontendTestInstructions() {
  console.log('\n📋 Manual Frontend Test Instructions:');
  console.log('');
  console.log('1. Open browser to: http://localhost:5173');
  console.log('2. Click "Login" or navigate to /auth/login');
  console.log('3. Login with admin credentials:');
  console.log('   Email: admin@toolink.com');
  console.log('   Password: admin123');
  console.log('4. After login, verify you can see admin menu items');
  console.log('5. Navigate to Admin Dashboard (/admin)');
  console.log('6. Navigate away (e.g., to /dashboard)');
  console.log('7. Navigate back to Admin Dashboard (/admin)');
  console.log('8. Verify session persists and no "Access Denied" message');
  console.log('');
  console.log('Expected behavior:');
  console.log('✅ Admin can always access admin routes');
  console.log('✅ Session persists during navigation');
  console.log('✅ No "Access Denied" after navigating back');
  console.log('✅ Non-admins see "Access Denied" for admin routes');
}

if (require.main === module) {
  testAdminSession().then(() => {
    printFrontendTestInstructions();
  });
}

module.exports = { testAdminSession };
