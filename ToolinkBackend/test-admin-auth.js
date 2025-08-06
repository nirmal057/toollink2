import axios from 'axios';

async function testAdminMessagesAccess() {
    try {
        console.log('🔑 Testing admin messages access without authentication...');

        // Try to access the main messages endpoint (which requires auth)
        const response = await axios.get('http://localhost:5000/api/messages/');

        console.log('📨 Response status:', response.status);
        console.log('📄 Response data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('❌ Expected authentication error');
        if (error.response) {
            console.log('📨 Response status:', error.response.status);
            console.log('📄 Error response:', JSON.stringify(error.response.data, null, 2));

            if (error.response.status === 401) {
                console.log('✅ Authentication is working correctly - admin endpoint requires auth');
            }
        } else {
            console.error('Network error:', error.message);
        }
    }
}

testAdminMessagesAccess();
