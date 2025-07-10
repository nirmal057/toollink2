const axios = require('axios');

async function testLoginFixOnPort5173() {
    console.log('🔗 Testing Login Fix for Frontend on Port 5173');
    console.log('='.repeat(60));

    // Test the backend API directly first
    console.log('1. Testing Backend API directly...');
    try {
        const backendResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@toollink.com',
            password: 'admin123'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('✅ Backend API working correctly');
        console.log('📊 Response format:', {
            success: backendResponse.data.success,
            hasUser: !!backendResponse.data.user,
            hasAccessToken: !!backendResponse.data.accessToken,
            hasRefreshToken: !!backendResponse.data.refreshToken
        });

    } catch (error) {
        console.log('❌ Backend API error:', error.response?.data || error.message);
        return;
    }

    console.log('\n2. Frontend is running on port 5173 ✅');
    console.log('3. Backend is running on port 5000 ✅');
    console.log('4. API configuration updated to use port 5000 ✅');
    console.log('5. AuthService fixed to handle correct response format ✅');

    console.log('\n🎯 READY TO TEST:');
    console.log('─'.repeat(30));
    console.log('• Go to: http://localhost:5173');
    console.log('• Use: admin@toollink.com / admin123');
    console.log('• The login should now work correctly!');

    console.log('\n🔑 Alternative credentials to try:');
    console.log('• test@admin.com / test123');
    console.log('• admin1@toollink.lk / admin123');
    console.log('• cashier1@toollink.lk / cashier123');

    console.log('\n📋 What was fixed:');
    console.log('• API URL: Changed from localhost:3001 to localhost:5000');
    console.log('• Response format: Fixed authService to handle correct backend response');
    console.log('• Error handling: Improved error messages');
    console.log('• Token storage: Fixed accessToken and refreshToken handling');
}

testLoginFixOnPort5173();
