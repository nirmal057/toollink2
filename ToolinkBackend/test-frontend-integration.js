#!/usr/bin/env node

/**
 * Frontend-Backend Integration Test
 * Tests the exact API calls that the frontend makes
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Simulate the exact frontend login request
function frontendLogin(email, password) {
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
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/json',
        'Origin': 'http://localhost:5173'
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
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
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

// Test the exact frontend integration
async function testFrontendIntegration() {
  console.log('🔗 Frontend-Backend Integration Test');
  console.log('===================================\n');

  try {
    console.log('🔐 Testing frontend login flow...');
    const result = await frontendLogin('admin@toollink.com', 'admin123');
    
    console.log(`📊 Response Status: ${result.statusCode}`);
    console.log(`📦 CORS Headers: ${result.headers['access-control-allow-origin'] || 'Not set'}`);
    
    if (result.statusCode === 200) {
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('📋 Response Data:');
      console.log('   Success:', result.data.success);
      console.log('   User:', result.data.user ? '✅ Present' : '❌ Missing');
      console.log('   Access Token:', result.data.accessToken ? '✅ Present' : '❌ Missing');
      console.log('   Refresh Token:', result.data.refreshToken ? '✅ Present' : '❌ Missing');
      
      if (result.data.user) {
        console.log('   User Details:');
        console.log('     - ID:', result.data.user._id || result.data.user.id);
        console.log('     - Username:', result.data.user.username);
        console.log('     - Email:', result.data.user.email);
        console.log('     - Role:', result.data.user.role);
      }
      
      console.log('\n🎉 Frontend should be able to login successfully!');
      console.log('💡 Credentials to use in frontend:');
      console.log('   Email: admin@toollink.com');
      console.log('   Password: admin123');
      
    } else {
      console.log('❌ LOGIN FAILED');
      console.log('📋 Error Details:');
      console.log('   Message:', result.data.error || result.data.message);
      console.log('   Type:', result.data.errorType);
    }

  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('💡 Make sure both frontend and backend are running');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Backend: http://localhost:5000');
  }
}

// Run the test
testFrontendIntegration();
