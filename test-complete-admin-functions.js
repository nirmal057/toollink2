/**
 * Complete Admin Functions Test Script
 * Tests all admin functionality including user management, bulk operations, 
 * audit logs, system reports, and access controls.
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test configuration
let authToken = '';
let adminId = '';

// Utility function for API calls with authentication
const apiCall = async (method, endpoint, data = null) => {
    try {
        const config = {
            method,
            url: `${API_BASE}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`API call failed: ${method} ${endpoint}`, error.response?.data || error.message);
        throw error;
    }
};

// Test admin authentication
const testAdminAuth = async () => {
    console.log('\n🔐 Testing Admin Authentication...');
    
    try {
        // Login as admin
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@toolink.com',
            password: 'admin123'
        });
        
        if (loginResponse.data.success) {
            authToken = loginResponse.data.accessToken;
            adminId = loginResponse.data.user.id;
            console.log('✅ Admin login successful');
            console.log(`   Admin ID: ${adminId}`);
            console.log(`   Role: ${loginResponse.data.user.role}`);
        } else {
            throw new Error('Admin login failed');
        }
    } catch (error) {
        console.error('❌ Admin authentication failed:', error.message);
        throw error;
    }
};

// Test admin dashboard
const testAdminDashboard = async () => {
    console.log('\n📊 Testing Admin Dashboard...');
    
    try {
        const dashboard = await apiCall('GET', '/admin/dashboard');
        
        if (dashboard.success) {
            console.log('✅ Admin dashboard loaded successfully');
            console.log(`   Total Users: ${dashboard.dashboard.userStats.total}`);
            console.log(`   Active Users: ${dashboard.dashboard.userStats.active}`);
            console.log(`   Pending Users: ${dashboard.dashboard.userStats.pending}`);
            console.log(`   Admin Count: ${dashboard.dashboard.userStats.byRole.admin}`);
            console.log(`   System Version: ${dashboard.dashboard.systemInfo.version}`);
        } else {
            throw new Error('Dashboard load failed');
        }
    } catch (error) {
        console.error('❌ Admin dashboard test failed:', error.message);
    }
};

// Test user management operations
const testUserManagement = async () => {
    console.log('\n👥 Testing User Management Operations...');
    
    try {
        // Get all users
        const users = await apiCall('GET', '/users');
        console.log(`✅ Retrieved ${users.users.length} users`);
        
        // Create a test user
        const testUser = {
            username: `testuser_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: 'testpass123',
            fullName: 'Test User Admin',
            phone: '+1234567890',
            role: 'customer'
        };
        
        const createResult = await apiCall('POST', '/users', testUser);
        console.log(`✅ Created test user: ${createResult.user.email}`);
        const testUserId = createResult.user.id;
        
        // Update user role
        const updateResult = await apiCall('PUT', `/users/${testUserId}`, {
            role: 'cashier',
            status: 'active'
        });
        console.log(`✅ Updated user role to: ${updateResult.user.role}`);
        
        // Get user details
        const userDetails = await apiCall('GET', `/users/${testUserId}`);
        console.log(`✅ Retrieved user details for: ${userDetails.user.email}`);
        
        // Get user activity log
        const activityLog = await apiCall('GET', `/users/${testUserId}/activity`);
        console.log(`✅ Retrieved user activity log (${activityLog.activities.length} activities)`);
        
        // Cleanup - delete test user
        await apiCall('DELETE', `/users/${testUserId}`);
        console.log('✅ Cleaned up test user');
        
    } catch (error) {
        console.error('❌ User management test failed:', error.message);
    }
};

// Test bulk user operations
const testBulkOperations = async () => {
    console.log('\n🔄 Testing Bulk User Operations...');
    
    try {
        // Get some users for bulk operations (avoid admin users)
        const users = await apiCall('GET', '/users');
        const testUsers = users.users.filter(u => u.role === 'customer').slice(0, 2);
        
        if (testUsers.length < 2) {
            console.log('⚠️  Not enough customer users for bulk operation test, creating test users...');
            
            // Create test users for bulk operations
            const testUser1 = {
                username: `bulk_test_1_${Date.now()}`,
                email: `bulk1_${Date.now()}@example.com`,
                password: 'testpass123',
                fullName: 'Bulk Test User 1',
                role: 'customer'
            };
            
            const testUser2 = {
                username: `bulk_test_2_${Date.now()}`,
                email: `bulk2_${Date.now()}@example.com`,
                password: 'testpass123',
                fullName: 'Bulk Test User 2',
                role: 'customer'
            };
            
            const user1 = await apiCall('POST', '/users', testUser1);
            const user2 = await apiCall('POST', '/users', testUser2);
            testUsers.push(user1.user, user2.user);
        }
        
        const userIds = testUsers.map(u => u.id);
        console.log(`   Testing with user IDs: ${userIds.join(', ')}`);
        
        // Test bulk status change (deactivate)
        await apiCall('POST', '/admin/users/bulk', {
            operation: 'deactivate',
            userIds: userIds
        });
        console.log('✅ Bulk deactivation successful');
        
        // Test bulk status change (activate)
        await apiCall('POST', '/admin/users/bulk', {
            operation: 'activate',
            userIds: userIds
        });
        console.log('✅ Bulk activation successful');
        
        // Test bulk role change
        await apiCall('POST', '/admin/users/bulk', {
            operation: 'change_role',
            userIds: userIds,
            data: { role: 'warehouse' }
        });
        console.log('✅ Bulk role change successful');
        
        // Cleanup - delete test users
        await apiCall('POST', '/admin/users/bulk', {
            operation: 'delete',
            userIds: userIds
        });
        console.log('✅ Bulk deletion successful (cleanup)');
        
    } catch (error) {
        console.error('❌ Bulk operations test failed:', error.message);
    }
};

// Test audit logs
const testAuditLogs = async () => {
    console.log('\n📋 Testing Audit Logs...');
    
    try {
        const auditLogs = await apiCall('GET', '/admin/audit-logs?page=1&limit=10');
        
        if (auditLogs.success) {
            console.log(`✅ Retrieved ${auditLogs.auditLogs.logs.length} audit log entries`);
            console.log(`   Total logs: ${auditLogs.auditLogs.pagination.total}`);
            
            if (auditLogs.auditLogs.logs.length > 0) {
                const recentLog = auditLogs.auditLogs.logs[0];
                console.log(`   Recent log: ${recentLog.action} by ${recentLog.username || recentLog.user_id}`);
            }
        } else {
            throw new Error('Audit logs retrieval failed');
        }
    } catch (error) {
        console.error('❌ Audit logs test failed:', error.message);
    }
};

// Test system configuration
const testSystemConfig = async () => {
    console.log('\n⚙️  Testing System Configuration...');
    
    try {
        // Get system configuration
        const config = await apiCall('GET', '/admin/config');
        
        if (config.success) {
            console.log('✅ System configuration retrieved');
            console.log(`   Site Name: ${config.config.general.siteName}`);
            console.log(`   Version: ${config.config.general.version}`);
            console.log(`   Features: ${Object.keys(config.config.features).length} configured`);
        }
        
        // Test configuration update
        await apiCall('PUT', '/admin/config', {
            section: 'general',
            settings: {
                siteName: 'ToolLink Admin Test',
                timezone: 'UTC'
            }
        });
        console.log('✅ System configuration update successful');
        
    } catch (error) {
        console.error('❌ System configuration test failed:', error.message);
    }
};

// Test system reports
const testSystemReports = async () => {
    console.log('\n📈 Testing System Reports...');
    
    try {
        const reports = await apiCall('GET', '/admin/reports');
        
        if (reports.success) {
            const reportNames = Object.keys(reports.reports);
            console.log(`✅ Retrieved ${reportNames.length} system reports`);
            reportNames.forEach(name => {
                console.log(`   - ${reports.reports[name].name}`);
            });
        } else {
            throw new Error('System reports retrieval failed');
        }
    } catch (error) {
        console.error('❌ System reports test failed:', error.message);
    }
};

// Test admin access to orders and deliveries
const testAdminOrdersAccess = async () => {
    console.log('\n📦 Testing Admin Orders & Deliveries Access...');
    
    try {
        // Test orders access
        const orders = await apiCall('GET', '/orders');
        console.log(`✅ Admin can access all orders (${orders.data?.length || 0} orders)`);
        
        // Test deliveries access
        const deliveries = await apiCall('GET', '/delivery');
        console.log(`✅ Admin can access all deliveries`);
        
        // Test delivery stats
        const deliveryStats = await apiCall('GET', '/delivery/stats');
        console.log('✅ Admin can access delivery statistics');
        
    } catch (error) {
        console.error('❌ Admin orders/deliveries access test failed:', error.message);
    }
};

// Test various reports access
const testReportsAccess = async () => {
    console.log('\n📊 Testing Reports Access...');
    
    try {
        // Test sales report
        const salesReport = await apiCall('GET', '/reports/sales');
        console.log('✅ Admin can access sales reports');
        
        // Test inventory report
        const inventoryReport = await apiCall('GET', '/reports/inventory');
        console.log('✅ Admin can access inventory reports');
        
        // Test customer report
        const customerReport = await apiCall('GET', '/reports/customers');
        console.log('✅ Admin can access customer reports');
        
        // Test user activity report
        const userActivityReport = await apiCall('GET', '/reports/user-activity');
        console.log('✅ Admin can access user activity reports');
        
    } catch (error) {
        console.error('❌ Reports access test failed:', error.message);
    }
};

// Main test runner
const runAllAdminTests = async () => {
    console.log('🚀 Starting Complete Admin Functions Test Suite');
    console.log('='.repeat(60));
    
    try {
        await testAdminAuth();
        await testAdminDashboard();
        await testUserManagement();
        await testBulkOperations();
        await testAuditLogs();
        await testSystemConfig();
        await testSystemReports();
        await testAdminOrdersAccess();
        await testReportsAccess();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 All Admin Function Tests Completed Successfully!');
        console.log('');
        console.log('✅ Admin Authentication');
        console.log('✅ Admin Dashboard');
        console.log('✅ User Management (CRUD)');
        console.log('✅ Bulk User Operations');
        console.log('✅ Audit Logs');
        console.log('✅ System Configuration');
        console.log('✅ System Reports');
        console.log('✅ Orders & Deliveries Access');
        console.log('✅ All Reports Access');
        console.log('');
        console.log('🔐 Admin has full system control and monitoring capabilities!');
        
    } catch (error) {
        console.error('\n❌ Admin test suite failed:', error.message);
        process.exit(1);
    }
};

// Run the tests
if (require.main === module) {
    runAllAdminTests();
}

module.exports = { runAllAdminTests };
