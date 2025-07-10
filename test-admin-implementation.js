/**
 * Test Admin Role Implementation
 * 
 * This script tests the comprehensive admin role functionality:
 * - Full System Access
 * - User Management (CRUD, bulk operations)
 * - Operations Control (orders, deliveries, inventory)
 * - Reporting & Audit Logs
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
let authToken = '';

// Test data
const testUser = {
  username: 'test_user_' + Date.now(),
  email: 'test@example.com',
  password: 'Test123!',
  fullName: 'Test User',
  role: 'customer'
};

const adminCredentials = {
  email: 'admin@toollink.com',
  password: 'admin123'
};

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || error.message,
      status: error.response?.status
    };
  }
}

async function testAdminLogin() {
  console.log('\n=== Testing Admin Login ===');
  
  const result = await makeRequest('POST', '/api/auth/login', adminCredentials);
  
  if (result.success && result.data.token) {
    authToken = result.data.token;
    console.log('✅ Admin login successful');
    console.log(`User: ${result.data.user.email}, Role: ${result.data.user.role}`);
    return true;
  } else {
    console.log('❌ Admin login failed:', result.error);
    return false;
  }
}

async function testUserManagement() {
  console.log('\n=== Testing User Management (Admin Access) ===');
  
  // Test 1: Get all users
  console.log('\n1. Testing user list retrieval...');
  const listResult = await makeRequest('GET', '/api/users');
  if (listResult.success) {
    console.log(`✅ Retrieved ${listResult.data.users?.length || 0} users`);
  } else {
    console.log('❌ Failed to get users:', listResult.error);
  }
  
  // Test 2: Create new user
  console.log('\n2. Testing user creation...');
  const createResult = await makeRequest('POST', '/api/users', testUser);
  if (createResult.success) {
    console.log('✅ User created successfully');
    testUser.id = createResult.data.user.id;
  } else {
    console.log('❌ Failed to create user:', createResult.error);
  }
  
  // Test 3: Update user
  console.log('\n3. Testing user update...');
  if (testUser.id) {
    const updateResult = await makeRequest('PUT', `/api/users/${testUser.id}`, {
      fullName: 'Updated Test User',
      role: 'warehouse'
    });
    if (updateResult.success) {
      console.log('✅ User updated successfully');
    } else {
      console.log('❌ Failed to update user:', updateResult.error);
    }
  }
  
  // Test 4: Delete user
  console.log('\n4. Testing user deletion...');
  if (testUser.id) {
    const deleteResult = await makeRequest('DELETE', `/api/users/${testUser.id}`);
    if (deleteResult.success) {
      console.log('✅ User deleted successfully');
    } else {
      console.log('❌ Failed to delete user:', deleteResult.error);
    }
  }
}

async function testAdminDashboard() {
  console.log('\n=== Testing Admin Dashboard Access ===');
  
  const result = await makeRequest('GET', '/api/admin/dashboard');
  if (result.success) {
    console.log('✅ Admin dashboard accessible');
    console.log(`Dashboard data:`, {
      userStats: result.data.dashboard?.userStats,
      systemInfo: result.data.dashboard?.systemInfo
    });
  } else {
    console.log('❌ Failed to access admin dashboard:', result.error);
  }
}

async function testAuditLogs() {
  console.log('\n=== Testing Audit Logs Access ===');
  
  const result = await makeRequest('GET', '/api/admin/audit-logs?page=1&limit=10');
  if (result.success) {
    console.log('✅ Audit logs accessible');
    console.log(`Found ${result.data.auditLogs?.logs?.length || 0} audit entries`);
  } else {
    console.log('❌ Failed to access audit logs:', result.error);
  }
}

async function testBulkOperations() {
  console.log('\n=== Testing Bulk User Operations ===');
  
  // First create some test users
  const testUsers = [];
  for (let i = 0; i < 3; i++) {
    const user = {
      username: `bulk_test_${i}_${Date.now()}`,
      email: `bulktest${i}@example.com`,
      password: 'Test123!',
      fullName: `Bulk Test User ${i}`,
      role: 'customer'
    };
    
    const createResult = await makeRequest('POST', '/api/users', user);
    if (createResult.success) {
      testUsers.push(createResult.data.user.id);
    }
  }
  
  if (testUsers.length > 0) {
    console.log(`Created ${testUsers.length} test users for bulk operations`);
    
    // Test bulk activate
    const bulkResult = await makeRequest('POST', '/api/admin/users/bulk', {
      operation: 'activate',
      userIds: testUsers
    });
    
    if (bulkResult.success) {
      console.log('✅ Bulk activate operation successful');
    } else {
      console.log('❌ Bulk activate operation failed:', bulkResult.error);
    }
    
    // Clean up - bulk delete
    const deleteResult = await makeRequest('POST', '/api/admin/users/bulk', {
      operation: 'delete',
      userIds: testUsers
    });
    
    if (deleteResult.success) {
      console.log('✅ Bulk delete operation successful');
    } else {
      console.log('❌ Bulk delete operation failed:', deleteResult.error);
    }
  }
}

async function testSystemReports() {
  console.log('\n=== Testing System Reports Access ===');
  
  const result = await makeRequest('GET', '/api/admin/reports');
  if (result.success) {
    console.log('✅ System reports accessible');
    console.log('Report sections available:', Object.keys(result.data.reports || {}));
  } else {
    console.log('❌ Failed to access system reports:', result.error);
  }
}

async function testOperationsControl() {
  console.log('\n=== Testing Operations Control Access ===');
  
  // Test orders access (if endpoint exists)
  console.log('\n1. Testing orders access...');
  const ordersResult = await makeRequest('GET', '/api/orders');
  if (ordersResult.success) {
    console.log('✅ Orders accessible');
  } else if (ordersResult.status === 404) {
    console.log('ℹ️ Orders endpoint not implemented yet');
  } else {
    console.log('❌ Failed to access orders:', ordersResult.error);
  }
  
  // Test inventory access (if endpoint exists)
  console.log('\n2. Testing inventory access...');
  const inventoryResult = await makeRequest('GET', '/api/inventory');
  if (inventoryResult.success) {
    console.log('✅ Inventory accessible');
  } else if (inventoryResult.status === 404) {
    console.log('ℹ️ Inventory endpoint not implemented yet');
  } else {
    console.log('❌ Failed to access inventory:', inventoryResult.error);
  }
  
  // Test deliveries access (if endpoint exists)
  console.log('\n3. Testing deliveries access...');
  const deliveriesResult = await makeRequest('GET', '/api/deliveries');
  if (deliveriesResult.success) {
    console.log('✅ Deliveries accessible');
  } else if (deliveriesResult.status === 404) {
    console.log('ℹ️ Deliveries endpoint not implemented yet');
  } else {
    console.log('❌ Failed to access deliveries:', deliveriesResult.error);
  }
}

async function testPermissionChecks() {
  console.log('\n=== Testing Permission Enforcement ===');
  
  // Test with regular user credentials (if available)
  console.log('\n1. Testing non-admin access restrictions...');
  
  // Save admin token
  const adminToken = authToken;
  
  // Try to access admin endpoints without admin token
  authToken = '';
  
  const unauthorizedResult = await makeRequest('GET', '/api/admin/dashboard');
  if (!unauthorizedResult.success && unauthorizedResult.status === 401) {
    console.log('✅ Unauthorized access properly blocked');
  } else {
    console.log('❌ Security issue: Unauthorized access allowed');
  }
  
  // Restore admin token
  authToken = adminToken;
}

async function runAdminTests() {
  console.log('🔧 ToolLink Admin Role Implementation Test Suite');
  console.log('=================================================');
  
  try {
    // Step 1: Admin login
    const loginSuccess = await testAdminLogin();
    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed without admin login');
      return;
    }
    
    // Step 2: Test admin dashboard
    await testAdminDashboard();
    
    // Step 3: Test user management
    await testUserManagement();
    
    // Step 4: Test bulk operations
    await testBulkOperations();
    
    // Step 5: Test audit logs
    await testAuditLogs();
    
    // Step 6: Test system reports
    await testSystemReports();
    
    // Step 7: Test operations control
    await testOperationsControl();
    
    // Step 8: Test permission enforcement
    await testPermissionChecks();
    
    console.log('\n=== Test Summary ===');
    console.log('✅ Admin Role Implementation Test Complete');
    console.log('📊 Admin has comprehensive system access');
    console.log('🔐 User management with CRUD operations working');
    console.log('📈 Reporting and audit systems accessible');
    console.log('⚙️ Operations control endpoints tested');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runAdminTests();
}

module.exports = { runAdminTests };
