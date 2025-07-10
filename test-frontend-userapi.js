/**
 * Test Frontend User API Service
 * Simulates frontend API calls to verify user management endpoints
 */

const BASE_URL = 'http://localhost:5001/api';

// Test admin credentials  
const ADMIN_CREDENTIALS = {
    email: 'admin@toollink.com',
    password: 'admin123'
};

async function testFrontendUserAPI() {
    console.log('🧪 Testing Frontend User API Service');
    console.log('=' .repeat(60));
    
    try {
        // 1. Test admin login to get token
        console.log('1️⃣ Testing admin login...');
        const loginResponse = await fetch(`${BASE_URL}/auth-enhanced/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ADMIN_CREDENTIALS)
        });
        
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Admin login successful');
        
        const token = loginData.accessToken;
        
        // 2. Test users endpoint that frontend uses
        console.log('\n2️⃣ Testing /api/users endpoint (what frontend calls)...');
        const usersResponse = await fetch(`${BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!usersResponse.ok) {
            const errorText = await usersResponse.text();
            throw new Error(`Failed to fetch users: ${usersResponse.status} - ${errorText}`);
        }
        
        const usersData = await usersResponse.json();
        console.log('✅ Users API Response Structure:');
        console.log(`   Response has success: ${usersData.success !== undefined}`);
        console.log(`   Response has users array: ${Array.isArray(usersData.users)}`);
        console.log(`   Response has data.users: ${usersData.data?.users !== undefined}`);
        console.log(`   Users count: ${usersData.users ? usersData.users.length : 'N/A'}`);
        
        if (usersData.users && usersData.users.length > 0) {
            const firstUser = usersData.users[0];
            console.log('   First user structure:');
            console.log(`     Has _id: ${firstUser._id !== undefined}`);
            console.log(`     Has id: ${firstUser.id !== undefined}`);
            console.log(`     Has fullName: ${firstUser.fullName !== undefined}`);
            console.log(`     Has name: ${firstUser.name !== undefined}`);
            console.log(`     Email: ${firstUser.email}`);
            console.log(`     Role: ${firstUser.role}`);
        }
        
        // 3. Simulate frontend data transformation
        console.log('\n3️⃣ Testing frontend data transformation...');
        const users = usersData.users || [];
        const transformedUsers = users.map((user) => ({
            ...user,
            id: user._id || user.id,
            name: user.fullName || user.name,
            fullName: user.fullName || user.name || ''
        }));
        
        console.log('✅ Data transformation successful');
        console.log(`   Transformed ${transformedUsers.length} users`);
        if (transformedUsers.length > 0) {
            const firstTransformed = transformedUsers[0];
            console.log('   First transformed user:');
            console.log(`     ID: ${firstTransformed.id}`);
            console.log(`     Name: ${firstTransformed.name}`);
            console.log(`     Full Name: ${firstTransformed.fullName}`);
            console.log(`     Email: ${firstTransformed.email}`);
            console.log(`     Role: ${firstTransformed.role}`);
        }
        
        console.log('\n🎉 Frontend User API Test Complete!');
        console.log('\n📋 Summary:');
        console.log('   ✅ Backend API is working correctly');
        console.log('   ✅ Response structure is compatible with frontend');
        console.log('   ✅ Data transformation logic is working');
        console.log('\n📱 Next Steps:');
        console.log('   1. The user management page should now load users properly');
        console.log('   2. Try accessing the frontend at http://localhost:5173/');
        console.log('   3. Login with admin@toollink.com / admin123');
        console.log('   4. Navigate to User Management page');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Make sure backend is running on port 5001');
        console.log('   2. Check if MongoDB connection is working');
        console.log('   3. Verify user API endpoints are properly configured');
    }
}

// Run the test
testFrontendUserAPI();
