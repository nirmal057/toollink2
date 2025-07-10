const axios = require('axios');

// Base URL for the API
const API_BASE_URL = 'http://localhost:5000/api';

async function debugFrontendPermissions() {
    console.log('🔍 Debugging Frontend Permissions...\n');

    try {
        // 1. Login as admin
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        console.log('✅ Admin login successful');

        // Extract token
        const token = loginResponse.data.accessToken;
        console.log('📝 Token received:', token ? token.substring(0, 20) + '...' : 'No token received');

        // 2. Get user profile
        console.log('2. Getting user profile...');
        const profileResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ User profile retrieved:');
        console.log('   - User ID:', profileResponse.data.user._id);
        console.log('   - Email:', profileResponse.data.user.email);
        console.log('   - Role:', profileResponse.data.user.role);
        console.log('   - Status:', profileResponse.data.user.status);
        console.log('   - Permissions:', profileResponse.data.user.permissions);

        // 3. Check what localStorage would contain
        console.log('\n3. Simulating localStorage data:');
        const userDataForLocalStorage = {
            user: {
                id: profileResponse.data.user._id,
                email: profileResponse.data.user.email,
                role: profileResponse.data.user.role,
                status: profileResponse.data.user.status,
                permissions: profileResponse.data.user.permissions
            },
            token: token
        };

        console.log('📦 User data for localStorage:', JSON.stringify(userDataForLocalStorage, null, 2));

        // 4. Test RBAC permission check simulation
        console.log('\n4. Testing RBAC permission checks:');

        // Simulate frontend RBAC check
        const user = userDataForLocalStorage.user;
        console.log('   - User Role:', user.role);
        console.log('   - Is Admin:', user.role === 'admin');
        console.log('   - Has USER_MANAGEMENT permission:', user.permissions && user.permissions.includes('USER_MANAGEMENT'));
        console.log('   - Has FULL_SYSTEM_ACCESS permission:', user.permissions && user.permissions.includes('FULL_SYSTEM_ACCESS'));

        // 5. Test API call with proper headers
        console.log('\n5. Testing API calls with token:');

        // Get users
        const usersResponse = await axios.get(`${API_BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Users API call successful');
        console.log('   - Total users:', usersResponse.data.pagination.total);
        console.log('   - Sample user ID:', usersResponse.data.users[0]._id);

        // Try to edit first user
        const sampleUser = usersResponse.data.users[0];
        const editResponse = await axios.put(`${API_BASE_URL}/users/${sampleUser._id}`, {
            name: sampleUser.name + ' (edited)',
            email: sampleUser.email,
            role: sampleUser.role
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Edit user API call successful');
        console.log('   - Updated user name:', editResponse.data.user.name);

        console.log('\n🎉 All backend operations working correctly!');
        console.log('💡 Issue must be in frontend permission checking or token handling');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('   - Status:', error.response.status);
            console.error('   - Headers:', error.response.headers);
        }
    }
}

// Run the debug
debugFrontendPermissions().catch(console.error);
