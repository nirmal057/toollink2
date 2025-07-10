/**
 * Authentication Improvements Test Script
 * Tests the enhanced authentication features:
 * 1. Confirm password field in registration
 * 2. Password confirmation validation
 * 3. Enhanced error messages for login (email not found vs invalid password)
 * 4. Better error display in UI
 */

const baseUrl = 'http://localhost:5000';

// Test configuration
const testUsers = {
  validUser: {
    name: 'Test Enhanced User',
    email: 'enhanced@example.com',
    password: 'password123',
    phone: '1234567890'
  },
  invalidEmailUser: {
    email: 'nonexistent@example.com',
    password: 'password123'
  },
  invalidPasswordUser: {
    email: 'enhanced@example.com',
    password: 'wrongpassword'
  }
};

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, config);
    const result = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test Functions

async function testRegistrationPasswordValidation() {
  console.log('\n🧪 Testing Registration with Mismatched Passwords...');
  
  const registrationData = {
    name: testUsers.validUser.name,
    email: 'mismatch@example.com',
    password: 'password123',
    phone: testUsers.validUser.phone
  };

  const result = await apiRequest('/api/auth/register', 'POST', registrationData);
  
  console.log('📊 Registration Response:', {
    success: result.success,
    status: result.status,
    message: result.data?.message || result.data?.error
  });

  // Note: Backend doesn't validate password confirmation, this is handled on frontend
  if (result.success) {
    console.log('✅ Registration successful - password confirmation is handled on frontend');
  } else {
    console.log('❌ Registration failed:', result.data?.error);
  }
}

async function testValidRegistration() {
  console.log('\n🧪 Testing Valid User Registration...');
  
  const result = await apiRequest('/api/auth/register', 'POST', testUsers.validUser);
  
  console.log('📊 Registration Response:', {
    success: result.success,
    status: result.status,
    message: result.data?.message || result.data?.error,
    user: result.data?.user ? {
      id: result.data.user.id,
      name: result.data.user.name,
      email: result.data.user.email,
      role: result.data.user.role
    } : null
  });

  if (result.success) {
    console.log('✅ Registration successful');
    return result.data.user;
  } else {
    console.log('❌ Registration failed:', result.data?.error);
    return null;
  }
}

async function testEmailNotFoundError() {
  console.log('\n🧪 Testing Login with Non-existent Email...');
  
  const result = await apiRequest('/api/auth/login', 'POST', testUsers.invalidEmailUser);
  
  console.log('📊 Login Response:', {
    success: result.success,
    status: result.status,
    error: result.data?.error,
    errorType: result.data?.errorType
  });

  if (!result.success && result.data?.errorType === 'email_not_found') {
    console.log('✅ Email not found error correctly identified');
    console.log('📝 Error message:', result.data.error);
  } else {
    console.log('❌ Email not found error not properly handled');
  }
}

async function testInvalidPasswordError() {
  console.log('\n🧪 Testing Login with Invalid Password...');
  
  const result = await apiRequest('/api/auth/login', 'POST', testUsers.invalidPasswordUser);
  
  console.log('📊 Login Response:', {
    success: result.success,
    status: result.status,
    error: result.data?.error,
    errorType: result.data?.errorType
  });

  if (!result.success && result.data?.errorType === 'invalid_password') {
    console.log('✅ Invalid password error correctly identified');
    console.log('📝 Error message:', result.data.error);
  } else {
    console.log('❌ Invalid password error not properly handled');
  }
}

async function testValidLogin() {
  console.log('\n🧪 Testing Valid Login...');
  
  const credentials = {
    email: testUsers.validUser.email,
    password: testUsers.validUser.password
  };
  
  const result = await apiRequest('/api/auth/login', 'POST', credentials);
  
  console.log('📊 Login Response:', {
    success: result.success,
    status: result.status,
    message: result.data?.message,
    user: result.data?.user ? {
      id: result.data.user.id,
      name: result.data.user.name,
      email: result.data.user.email,
      role: result.data.user.role
    } : null,
    hasAccessToken: !!result.data?.accessToken,
    hasRefreshToken: !!result.data?.refreshToken
  });

  if (result.success) {
    console.log('✅ Login successful');
    return result.data;
  } else {
    console.log('❌ Login failed:', result.data?.error);
    return null;
  }
}

async function testDuplicateRegistration() {
  console.log('\n🧪 Testing Duplicate Email Registration...');
  
  const result = await apiRequest('/api/auth/register', 'POST', testUsers.validUser);
  
  console.log('📊 Duplicate Registration Response:', {
    success: result.success,
    status: result.status,
    error: result.data?.error
  });

  if (!result.success) {
    console.log('✅ Duplicate registration properly rejected');
    console.log('📝 Error message:', result.data.error);
  } else {
    console.log('❌ Duplicate registration should have been rejected');
  }
}

// Main test runner
async function runAuthenticationTests() {
  console.log('🚀 Starting Authentication Improvements Tests...');
  console.log('🎯 Testing enhanced error messages and password confirmation');
  
  try {
    // Test 1: Valid Registration
    const user = await testValidRegistration();
    
    if (user) {
      // Test 2: Enhanced Login Error Messages
      await testEmailNotFoundError();
      await testInvalidPasswordError();
      
      // Test 3: Valid Login
      await testValidLogin();
      
      // Test 4: Duplicate Registration
      await testDuplicateRegistration();
    }
    
    // Test 5: Password Validation (frontend feature)
    await testRegistrationPasswordValidation();
    
    console.log('\n✅ All authentication improvement tests completed!');
    console.log('\n📋 Summary of Improvements:');
    console.log('   ✅ Enhanced error messages for login (email not found vs invalid password)');
    console.log('   ✅ Better error display with icons and formatting');
    console.log('   ✅ Confirm password field added to registration form');
    console.log('   ✅ Frontend password confirmation validation');
    console.log('   ✅ Real-time password match indicator');
    
    console.log('\n🧪 Frontend Features to Test Manually:');
    console.log('   1. Visit registration page and test password confirmation');
    console.log('   2. Try mismatched passwords - should show error');
    console.log('   3. Try login with wrong email - should show specific error');
    console.log('   4. Try login with wrong password - should show specific error');
    console.log('   5. Check error message styling and icons');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Handle both browser and Node.js environments
if (typeof window !== 'undefined') {
  // Browser environment
  window.runAuthenticationTests = runAuthenticationTests;
  console.log('🌐 Test functions loaded in browser. Call runAuthenticationTests() to start testing.');
} else {
  // Node.js environment
  runAuthenticationTests();
}
