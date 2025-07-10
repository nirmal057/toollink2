#!/usr/bin/env node

/**
 * Quick Login Test for Limited Mode Backend
 * Tests if login works without database connection
 */

const http = require('http');

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
        'Content-Length': Buffer.byteLength(postData),
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

async function quickLoginTest() {
  console.log('🔐 Testing Login Without Database');
  console.log('================================\n');

  try {
    // Test with mock credentials
    console.log('Testing mock admin credentials...');
    const result1 = await testLogin('admin@toollink.com', 'admin123');
    console.log(`Status: ${result1.statusCode}`);
    console.log(`Response:`, result1.data);
    
    console.log('\n' + '─'.repeat(50));
    
    // Test with other mock credentials
    console.log('\nTesting other mock credentials...');
    const result2 = await testLogin('user@toollink.com', 'user123');
    console.log(`Status: ${result2.statusCode}`);
    console.log(`Response:`, result2.data);

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

quickLoginTest();
