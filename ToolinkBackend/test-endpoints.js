#!/usr/bin/env node

/**
 * Quick endpoint test for ToolLink Backend
 * Tests basic functionality of all major API endpoints
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Test configuration
const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/api/health',
    expected: 200
  },
  {
    name: 'Database Test',
    method: 'GET', 
    path: '/api/db-test',
    expected: 200
  },
  {
    name: 'API Root',
    method: 'GET',
    path: '/api',
    expected: 200
  },
  {
    name: 'Auth Routes (without token - should fail)',
    method: 'GET',
    path: '/api/auth/me',
    expected: 401
  },
  {
    name: 'Users Routes (without token - should fail)',
    method: 'GET', 
    path: '/api/users',
    expected: 401
  },
  {
    name: 'Orders Routes (without token - should fail)',
    method: 'GET',
    path: '/api/orders',
    expected: 401
  },
  {
    name: 'Inventory Routes (without token - should fail)',
    method: 'GET',
    path: '/api/inventory',
    expected: 401
  },
  {
    name: 'Deliveries Routes (without token - should fail)',
    method: 'GET',
    path: '/api/deliveries',
    expected: 401
  },
  {
    name: 'Notifications Routes (without token - should fail)',
    method: 'GET',
    path: '/api/notifications',
    expected: 401
  },
  {
    name: 'Non-existent Route',
    method: 'GET',
    path: '/api/nonexistent',
    expected: 404
  }
];

// Simple HTTP request function
function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + path;
    const options = {
      method,
      timeout: 5000
    };

    const req = http.request(url, options, (res) => {
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

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 ToolLink Backend API Tests');
  console.log('=============================\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const result = await makeRequest(test.method, test.path);
      
      if (result.statusCode === test.expected) {
        console.log(`✅ PASS - ${test.method} ${test.path} returned ${result.statusCode}`);
        passed++;
      } else {
        console.log(`❌ FAIL - ${test.method} ${test.path} returned ${result.statusCode}, expected ${test.expected}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR - ${test.name}: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('=============================');
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Backend is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the backend configuration.');
  }
}

// Check if server is running first
makeRequest('GET', '/api/health')
  .then(() => {
    console.log('🟢 Server is running, starting tests...\n');
    runTests();
  })
  .catch(() => {
    console.log('🔴 Server is not running on port 5000');
    console.log('Please start the server with: npm start');
    process.exit(1);
  });
