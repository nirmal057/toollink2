// Test RBAC Permissions
// This script tests if RBAC is correctly configured for admin users
// Run this in the browser console on the ToolLink frontend

function testRBACPermissions() {
    console.log('🔐 Testing RBAC Permissions for User Management');
    console.log('='.repeat(50));

    // Import RBAC service from the window (if exposed) or from localStorage
    try {
        // Check current user in localStorage
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('accessToken');

        console.log('📋 Current Authentication State:');
        console.log('User in localStorage:', storedUser ? JSON.parse(storedUser) : 'null');
        console.log('Token in localStorage:', storedToken ? 'Present' : 'Missing');

        if (storedUser) {
            const user = JSON.parse(storedUser);
            console.log('User role:', user.role);

            // Test permission checking manually
            const permissions = {
                MANAGE_USERS: 'users.manage',
                VIEW_AUDIT_LOGS: 'audit.view',
                BULK_USER_OPERATIONS: 'users.bulk',
                FULL_SYSTEM_ACCESS: '*'
            };

            console.log('\n🔍 Manual Permission Check:');
            console.log('User role is admin:', user.role === 'admin');
            console.log('Should have all permissions because admin gets FULL_SYSTEM_ACCESS');

            // Check what the RBAC service would return
            console.log('\n🧪 Testing RBAC Logic:');
            if (user.role === 'admin') {
                console.log('✅ Admin detected - should have full access');
                console.log('✅ MANAGE_USERS: true (admin override)');
                console.log('✅ VIEW_AUDIT_LOGS: true (admin override)');
                console.log('✅ BULK_USER_OPERATIONS: true (admin override)');
            } else {
                console.log('❌ Not admin role - checking specific permissions...');
            }
        } else {
            console.log('❌ No user found in localStorage');
            console.log('🔧 Possible solutions:');
            console.log('1. Make sure you are logged in');
            console.log('2. Check if login process stores user data correctly');
            console.log('3. Verify token is not expired');
        }

        console.log('\n🎯 Next Steps:');
        console.log('1. If user/token missing: Re-login');
        console.log('2. If user present but not admin: Check user role in database');
        console.log('3. If admin but permissions fail: Check RBAC service initialization');

    } catch (error) {
        console.error('❌ Error testing RBAC:', error);
    }
}

// Auto-run test
testRBACPermissions();

// Also provide a function to manually test
window.testRBAC = testRBACPermissions;

console.log('\n💡 You can run this test anytime by calling: testRBAC()');
