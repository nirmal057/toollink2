// Simple script to test admin permissions in browser
console.log('🔍 Testing Admin Permissions in Browser');

// Check localStorage
console.log('1. Checking localStorage...');
const user = localStorage.getItem('user');
const token = localStorage.getItem('accessToken');

console.log('   - User data:', user ? JSON.parse(user) : 'No user in localStorage');
console.log('   - Token:', token ? token.substring(0, 20) + '...' : 'No token in localStorage');

// Test rbacService (if available)
if (typeof rbacService !== 'undefined') {
    console.log('2. Testing rbacService...');
    const currentUser = rbacService.getCurrentUser();
    console.log('   - Current user:', currentUser);

    const hasManageUsers = rbacService.hasPermission('users.manage');
    console.log('   - Has MANAGE_USERS permission:', hasManageUsers);

    console.log('   - User role:', currentUser?.role);
    console.log('   - Is admin role:', currentUser?.role === 'admin');
} else {
    console.log('2. rbacService not available in global scope');
}

// Test manual admin check
if (user) {
    const userData = JSON.parse(user);
    console.log('3. Manual admin check:');
    console.log('   - User role:', userData.role);
    console.log('   - Is admin:', userData.role === 'admin');
}

console.log('✅ Browser permission check complete');
