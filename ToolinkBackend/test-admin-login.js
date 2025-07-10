#!/usr/bin/env node

/**
 * Test Admin Login Script
 * Tests the admin login functionality
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Test login function
function testLogin(email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: email,
      password: password
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Test the admin login
async function testAdminLogin() {
  console.log('🧪 Testing Admin Login');
  console.log('=====================\n');

  try {
    console.log('🔐 Attempting admin login...');
    const result = await testLogin('admin@toollink.com', 'admin123');
    
    console.log(`📊 Response Status: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('📋 Response Data:');
      console.log('   Success:', result.data.success);
      console.log('   User ID:', result.data.user?.id);
      console.log('   Username:', result.data.user?.username);
      console.log('   Email:', result.data.user?.email);
      console.log('   Role:', result.data.user?.role);
      console.log('   Token:', result.data.accessToken ? 'Generated ✅' : 'Not generated ❌');
      console.log('   Refresh Token:', result.data.refreshToken ? 'Generated ✅' : 'Not generated ❌');
    } else {
      console.log('❌ LOGIN FAILED');
      console.log('📋 Error Details:');
      console.log('   Message:', result.data.error || result.data.message);
      console.log('   Type:', result.data.errorType);
    }

  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('💡 Make sure the backend server is running on port 5000');
  }

  console.log('\n🔗 You can now use these credentials to login:');
  console.log('   Frontend: http://localhost:5173');
  console.log('   Email: admin@toollink.com');
  console.log('   Password: admin123');
}

// Run the test
testAdminLogin();
