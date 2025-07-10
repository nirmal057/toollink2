#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testEnhancedAuth() {
  console.log('🧪 Testing Enhanced Authentication System...\n');

  try {
    // Test 1: Login with invalid email
    console.log('Test 1: Login with invalid email');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth-enhanced/login`, {
        email: 'nonexistent@example.com',
        password: 'password123'
      });
      console.log('❌ Expected 401 error but got success');
    } catch (error) {
      if (error.response?.status === 401 && error.response?.data?.message === 'Email or password is incorrect') {
        console.log('✅ Correctly returned 401 for invalid email');
      } else {
        console.log('❌ Unexpected response:', error.response?.data);
      }
    }

    // Test 2: Create a test user first
    console.log('\nTest 2: Creating test user');
    try {
      const testUser = {
        email: 'test@example.com',
        password: 'password123',
        role: 'customer',
        firstName: 'Test',
        lastName: 'User'
      };

      // Try to create user using the User model directly
      console.log('Creating test user directly in database...');
      
      // We'll use the existing auth register if available
      try {
        const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
        console.log('✅ Test user created via registration');
      } catch (regError) {
        console.log('Note: Could not create via registration, user might already exist');
      }
    } catch (error) {
      console.log('Note: Test user creation skipped');
    }

    // Test 3: Login with correct credentials
    console.log('\nTest 3: Login with correct credentials');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth-enhanced/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (response.data.success && response.data.accessToken) {
        console.log('✅ Successfully logged in with valid credentials');
        console.log('📋 User data:', {
          id: response.data.user.id,
          email: response.data.user.email,
          role: response.data.user.role
        });
        console.log('🔑 Access token received:', response.data.accessToken.substring(0, 20) + '...');
      } else {
        console.log('❌ Login successful but missing expected data');
      }
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
    }

    // Test 4: Login with wrong password (attempt tracking)
    console.log('\nTest 4: Testing failed login attempts');
    for (let i = 1; i <= 4; i++) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth-enhanced/login`, {
          email: 'test@example.com',
          password: 'wrongpassword'
        });
        console.log(`❌ Attempt ${i}: Expected failure but got success`);
      } catch (error) {
        const data = error.response?.data;
        if (data?.errorType === 'INVALID_CREDENTIALS') {
          console.log(`✅ Attempt ${i}: Correctly failed with remaining attempts: ${data.remainingAttempts}`);
        } else if (data?.errorType === 'ACCOUNT_LOCKED') {
          console.log(`✅ Attempt ${i}: Account correctly locked`);
          break;
        } else {
          console.log(`❌ Attempt ${i}: Unexpected response:`, data);
        }
      }
    }

    // Test 5: Test forgot password
    console.log('\nTest 5: Testing forgot password');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth-enhanced/forgot-password`, {
        email: 'test@example.com'
      });
      
      if (response.data.success) {
        console.log('✅ Forgot password request processed');
        if (response.data.resetToken) {
          console.log('🔑 Reset token (dev only):', response.data.resetToken.substring(0, 20) + '...');
        }
      } else {
        console.log('❌ Forgot password failed');
      }
    } catch (error) {
      console.log('❌ Forgot password error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Enhanced Authentication Tests Completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    if (response.data.status === 'OK') {
      console.log('✅ Server is running and database is connected\n');
      return true;
    }
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('Please start the backend server first:');
    console.log('cd ToolLink-MySQL-Backend && npm start');
    return false;
  }
}

async function main() {
  console.log('🚀 Enhanced Authentication System Test Suite\n');
  
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testEnhancedAuth();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testEnhancedAuth };
